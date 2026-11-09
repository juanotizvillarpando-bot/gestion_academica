using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

namespace GestionAcademica.Api.Data;

public class DbHelper
{
    public static string ConnectionString { get; set; } = 
        @"Server=.\SQLEXPRESS;Database=gestion academica;Integrated Security=True;TrustServerCertificate=True;";

    public static string MasterConnectionString
    {
        get
        {
            var builder = new SqlConnectionStringBuilder(ConnectionString)
            {
                InitialCatalog = "master"
            };
            return builder.ConnectionString;
        }
    }

    public static string FormatearErrorSql(Exception ex, string? accionContexto = null)
    {
        if (ex is SqlException sqlEx)
        {
            switch (sqlEx.Number)
            {
                case 547:
                    if (!string.IsNullOrEmpty(accionContexto))
                        return $"No se puede {accionContexto} porque tiene otros registros asociados vinculados en el sistema (ej. inscripciones u ofertas).";
                    return "No se puede completar la acción: el registro está vinculado con otros datos en la base de datos.";

                case 2601:
                case 2627:
                    if (sqlEx.Message.Contains("UQ_Ofertas_MateriaPeriodo", StringComparison.OrdinalIgnoreCase))
                        return "Esta materia ya está ofertada en el periodo seleccionado. No se pueden duplicar asignaciones en el mismo periodo.";
                    if (sqlEx.Message.Contains("UQ_Inscripciones_EstudianteOferta", StringComparison.OrdinalIgnoreCase))
                        return "El alumno ya se encuentra matriculado en esta misma oferta académica.";
                    return "Ya existe un registro con este código o clave única. El código no puede repetirse.";

                case 515:
                    return "Faltan datos obligatorios requeridos por la base de datos.";

                case 8152:
                    return "Uno de los textos ingresados supera el número máximo de caracteres permitidos.";

                case 53:
                case 40:
                    return "No se pudo establecer conexión con el servidor SQL Server. Verifica que el servicio esté iniciado en Windows.";

                default:
                    return $"Error de base de datos (SQL {sqlEx.Number}): {sqlEx.Message}";
            }
        }
        return ex.Message;
    }

    public static (bool Success, string Message) ProbarConexion(string? customConnStr = null)
    {
        try
        {
            using var con = new SqlConnection(customConnStr ?? ConnectionString);
            con.Open();
            using var cmd = new SqlCommand("SELECT @@VERSION", con);
            var version = cmd.ExecuteScalar()?.ToString() ?? "SQL Server Conectado";
            return (true, $"Conexión exitosa a SQL Server.\n{version.Split('\n')[0]}");
        }
        catch (Exception ex)
        {
            return (false, FormatearErrorSql(ex));
        }
    }

    public static (bool Success, string Message) InicializarBaseDeDatos(string rutaBaseSql, string rutaDatosSql)
    {
        try
        {
            if (!File.Exists(rutaBaseSql))
                return (false, $"No se encontró el archivo: {rutaBaseSql}");

            EjecutarScriptConGO(MasterConnectionString, rutaBaseSql);

            if (File.Exists(rutaDatosSql))
            {
                EjecutarScriptConGO(ConnectionString, rutaDatosSql);
            }

            return (true, "Base de datos y tablas inicializadas correctamente.");
        }
        catch (Exception ex)
        {
            return (false, $"Error al inicializar la base de datos: {FormatearErrorSql(ex)}");
        }
    }

    private static void EjecutarScriptConGO(string connStr, string filePath)
    {
        var sqlContent = File.ReadAllText(filePath);
        var batches = Regex.Split(sqlContent, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase);

        using var con = new SqlConnection(connStr);
        con.Open();

        foreach (var batch in batches)
        {
            var trimmed = batch.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) continue;

            using var cmd = new SqlCommand(trimmed, con);
            cmd.CommandTimeout = 60;
            cmd.ExecuteNonQuery();
        }
    }

    public static DataTable EjecutarConsulta(string query, params SqlParameter[] parameters)
    {
        var table = new DataTable();
        using var con = new SqlConnection(ConnectionString);
        using var cmd = new SqlCommand(query, con);
        if (parameters != null && parameters.Length > 0)
        {
            cmd.Parameters.AddRange(parameters);
        }
        using var adapter = new SqlDataAdapter(cmd);
        adapter.Fill(table);
        return table;
    }

    public static int EjecutarComando(string query, params SqlParameter[] parameters)
    {
        using var con = new SqlConnection(ConnectionString);
        con.Open();
        using var cmd = new SqlCommand(query, con);
        if (parameters != null && parameters.Length > 0)
        {
            cmd.Parameters.AddRange(parameters);
        }
        return cmd.ExecuteNonQuery();
    }

    // --- REPORTE GENERAL Y KPIs ---
    public static DataTable ObtenerReporteGeneral()
    {
        const string sql = """
            SELECT 
                i.InscripcionId,
                e.Codigo AS CodigoEstudiante,
                CONCAT(e.Nombres, ' ', e.Apellidos) AS Estudiante,
                m.Codigo AS CodigoMateria,
                m.Nombre AS Materia,
                CONCAT(d.Nombres, ' ', d.Apellidos) AS Docente,
                p.Codigo AS Periodo,
                i.NotaFinal,
                CASE 
                    WHEN i.NotaFinal >= 51 THEN 'Aprobado'
                    WHEN i.NotaFinal IS NOT NULL THEN 'Reprobado'
                    ELSE 'Pendiente'
                END AS Estado
            FROM dbo.Inscripciones i
            JOIN dbo.Estudiantes e ON e.EstudianteId = i.EstudianteId
            JOIN dbo.OfertasAcademicas o ON o.OfertaId = i.OfertaId
            JOIN dbo.Materias m ON m.MateriaId = o.MateriaId
            JOIN dbo.Docentes d ON d.DocenteId = o.DocenteId
            JOIN dbo.Periodos p ON p.PeriodoId = o.PeriodoId
            ORDER BY p.Codigo DESC, m.Nombre, e.Apellidos;
            """;
        return EjecutarConsulta(sql);
    }

    public static (int Estudiantes, int Docentes, int Materias, int Inscripciones) ObtenerKpis()
    {
        try
        {
            var est = Convert.ToInt32(EjecutarConsulta("SELECT COUNT(*) FROM dbo.Estudiantes").Rows[0][0]);
            var doc = Convert.ToInt32(EjecutarConsulta("SELECT COUNT(*) FROM dbo.Docentes").Rows[0][0]);
            var mat = Convert.ToInt32(EjecutarConsulta("SELECT COUNT(*) FROM dbo.Materias").Rows[0][0]);
            var ins = Convert.ToInt32(EjecutarConsulta("SELECT COUNT(*) FROM dbo.Inscripciones").Rows[0][0]);
            return (est, doc, mat, ins);
        }
        catch
        {
            return (0, 0, 0, 0);
        }
    }

    // --- ESTUDIANTES ---
    public static DataTable ObtenerEstudiantes()
    {
        return EjecutarConsulta("SELECT EstudianteId, Codigo, Nombres, Apellidos FROM dbo.Estudiantes ORDER BY Apellidos, Nombres;");
    }

    public static void GuardarEstudiante(int? id, string codigo, string nombres, string apellidos)
    {
        if (id.HasValue && id.Value > 0)
        {
            EjecutarComando("""
                UPDATE dbo.Estudiantes 
                SET Codigo = @Codigo, Nombres = @Nombres, Apellidos = @Apellidos
                WHERE EstudianteId = @Id;
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@Nombres", nombres),
                new SqlParameter("@Apellidos", apellidos),
                new SqlParameter("@Id", id.Value));
        }
        else
        {
            EjecutarComando("""
                INSERT INTO dbo.Estudiantes (Codigo, Nombres, Apellidos)
                VALUES (@Codigo, @Nombres, @Apellidos);
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@Nombres", nombres),
                new SqlParameter("@Apellidos", apellidos));
        }
    }

    public static void EliminarEstudiante(int id)
    {
        EjecutarComando("DELETE FROM dbo.Estudiantes WHERE EstudianteId = @Id;", new SqlParameter("@Id", id));
    }

    // --- DOCENTES ---
    public static DataTable ObtenerDocentes()
    {
        return EjecutarConsulta("SELECT DocenteId, Codigo, Nombres, Apellidos FROM dbo.Docentes ORDER BY Apellidos, Nombres;");
    }

    public static void GuardarDocente(int? id, string codigo, string nombres, string apellidos)
    {
        if (id.HasValue && id.Value > 0)
        {
            EjecutarComando("""
                UPDATE dbo.Docentes 
                SET Codigo = @Codigo, Nombres = @Nombres, Apellidos = @Apellidos
                WHERE DocenteId = @Id;
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@Nombres", nombres),
                new SqlParameter("@Apellidos", apellidos),
                new SqlParameter("@Id", id.Value));
        }
        else
        {
            EjecutarComando("""
                INSERT INTO dbo.Docentes (Codigo, Nombres, Apellidos)
                VALUES (@Codigo, @Nombres, @Apellidos);
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@Nombres", nombres),
                new SqlParameter("@Apellidos", apellidos));
        }
    }

    public static void EliminarDocente(int id)
    {
        EjecutarComando("DELETE FROM dbo.Docentes WHERE DocenteId = @Id;", new SqlParameter("@Id", id));
    }

    // --- MATERIAS ---
    public static DataTable ObtenerMaterias()
    {
        return EjecutarConsulta("SELECT MateriaId, Codigo, Nombre FROM dbo.Materias ORDER BY Nombre;");
    }

    public static void GuardarMateria(int? id, string codigo, string nombre)
    {
        if (id.HasValue && id.Value > 0)
        {
            EjecutarComando("""
                UPDATE dbo.Materias 
                SET Codigo = @Codigo, Nombre = @Nombre
                WHERE MateriaId = @Id;
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@Nombre", nombre),
                new SqlParameter("@Id", id.Value));
        }
        else
        {
            EjecutarComando("""
                INSERT INTO dbo.Materias (Codigo, Nombre)
                VALUES (@Codigo, @Nombre);
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@Nombre", nombre));
        }
    }

    public static void EliminarMateria(int id)
    {
        EjecutarComando("DELETE FROM dbo.Materias WHERE MateriaId = @Id;", new SqlParameter("@Id", id));
    }

    // --- PERIODOS ---
    public static DataTable ObtenerPeriodos()
    {
        return EjecutarConsulta("SELECT PeriodoId, Codigo, FechaInicio, FechaFin FROM dbo.Periodos ORDER BY FechaInicio DESC;");
    }

    public static void GuardarPeriodo(int? id, string codigo, DateTime fechaInicio, DateTime fechaFin)
    {
        if (id.HasValue && id.Value > 0)
        {
            EjecutarComando("""
                UPDATE dbo.Periodos 
                SET Codigo = @Codigo, FechaInicio = @FechaInicio, FechaFin = @FechaFin
                WHERE PeriodoId = @Id;
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@FechaInicio", fechaInicio.Date),
                new SqlParameter("@FechaFin", fechaFin.Date),
                new SqlParameter("@Id", id.Value));
        }
        else
        {
            EjecutarComando("""
                INSERT INTO dbo.Periodos (Codigo, FechaInicio, FechaFin)
                VALUES (@Codigo, @FechaInicio, @FechaFin);
                """,
                new SqlParameter("@Codigo", codigo),
                new SqlParameter("@FechaInicio", fechaInicio.Date),
                new SqlParameter("@FechaFin", fechaFin.Date));
        }
    }

    public static void EliminarPeriodo(int id)
    {
        EjecutarComando("DELETE FROM dbo.Periodos WHERE PeriodoId = @Id;", new SqlParameter("@Id", id));
    }

    // --- OFERTAS ACADEMICAS ---
    public static DataTable ObtenerOfertas()
    {
        const string sql = """
            SELECT 
                o.OfertaId,
                o.MateriaId,
                m.Nombre AS Materia,
                o.PeriodoId,
                p.Codigo AS Periodo,
                o.DocenteId,
                CONCAT(d.Nombres, ' ', d.Apellidos) AS Docente
            FROM dbo.OfertasAcademicas o
            JOIN dbo.Materias m ON m.MateriaId = o.MateriaId
            JOIN dbo.Periodos p ON p.PeriodoId = o.PeriodoId
            JOIN dbo.Docentes d ON d.DocenteId = o.DocenteId
            ORDER BY p.Codigo DESC, m.Nombre;
            """;
        return EjecutarConsulta(sql);
    }

    public static void GuardarOferta(int? id, int materiaId, int periodoId, int docenteId)
    {
        if (id.HasValue && id.Value > 0)
        {
            EjecutarComando("""
                UPDATE dbo.OfertasAcademicas 
                SET MateriaId = @MateriaId, PeriodoId = @PeriodoId, DocenteId = @DocenteId
                WHERE OfertaId = @Id;
                """,
                new SqlParameter("@MateriaId", materiaId),
                new SqlParameter("@PeriodoId", periodoId),
                new SqlParameter("@DocenteId", docenteId),
                new SqlParameter("@Id", id.Value));
        }
        else
        {
            EjecutarComando("""
                INSERT INTO dbo.OfertasAcademicas (MateriaId, PeriodoId, DocenteId)
                VALUES (@MateriaId, @PeriodoId, @DocenteId);
                """,
                new SqlParameter("@MateriaId", materiaId),
                new SqlParameter("@PeriodoId", periodoId),
                new SqlParameter("@DocenteId", docenteId));
        }
    }

    public static void EliminarOferta(int id)
    {
        EjecutarComando("DELETE FROM dbo.OfertasAcademicas WHERE OfertaId = @Id;", new SqlParameter("@Id", id));
    }

    // --- INSCRIPCIONES ---
    public static DataTable ObtenerInscripciones()
    {
        const string sql = """
            SELECT 
                i.InscripcionId,
                i.EstudianteId,
                CONCAT(e.Nombres, ' ', e.Apellidos, ' (', e.Codigo, ')') AS Estudiante,
                i.OfertaId,
                CONCAT(m.Nombre, ' - ', p.Codigo, ' [Doc: ', d.Nombres, ' ', d.Apellidos, ']') AS Oferta,
                i.NotaFinal
            FROM dbo.Inscripciones i
            JOIN dbo.Estudiantes e ON e.EstudianteId = i.EstudianteId
            JOIN dbo.OfertasAcademicas o ON o.OfertaId = i.OfertaId
            JOIN dbo.Materias m ON m.MateriaId = o.MateriaId
            JOIN dbo.Docentes d ON d.DocenteId = o.DocenteId
            JOIN dbo.Periodos p ON p.PeriodoId = o.PeriodoId
            ORDER BY p.Codigo DESC, m.Nombre, e.Apellidos;
            """;
        return EjecutarConsulta(sql);
    }

    public static void GuardarInscripcion(int? id, int estudianteId, int ofertaId, decimal? notaFinal)
    {
        object notaParam = notaFinal.HasValue ? notaFinal.Value : DBNull.Value;

        if (id.HasValue && id.Value > 0)
        {
            EjecutarComando("""
                UPDATE dbo.Inscripciones 
                SET EstudianteId = @EstudianteId, OfertaId = @OfertaId, NotaFinal = @NotaFinal
                WHERE InscripcionId = @Id;
                """,
                new SqlParameter("@EstudianteId", estudianteId),
                new SqlParameter("@OfertaId", ofertaId),
                new SqlParameter("@NotaFinal", SqlDbType.Decimal) { Value = notaParam, Precision = 5, Scale = 2 },
                new SqlParameter("@Id", id.Value));
        }
        else
        {
            EjecutarComando("""
                INSERT INTO dbo.Inscripciones (EstudianteId, OfertaId, NotaFinal)
                VALUES (@EstudianteId, @OfertaId, @NotaFinal);
                """,
                new SqlParameter("@EstudianteId", estudianteId),
                new SqlParameter("@OfertaId", ofertaId),
                new SqlParameter("@NotaFinal", SqlDbType.Decimal) { Value = notaParam, Precision = 5, Scale = 2 });
        }
    }

    public static void ActualizarNota(int inscripcionId, decimal? notaFinal)
    {
        object notaParam = notaFinal.HasValue ? notaFinal.Value : DBNull.Value;
        EjecutarComando("""
            UPDATE dbo.Inscripciones 
            SET NotaFinal = @NotaFinal
            WHERE InscripcionId = @Id;
            """,
            new SqlParameter("@NotaFinal", SqlDbType.Decimal) { Value = notaParam, Precision = 5, Scale = 2 },
            new SqlParameter("@Id", inscripcionId));
    }

    public static void EliminarInscripcion(int id)
    {
        EjecutarComando("DELETE FROM dbo.Inscripciones WHERE InscripcionId = @Id;", new SqlParameter("@Id", id));
    }

    public static void AsegurarTablaUsuarios()
    {
        try
        {
            const string sql = """
                IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.Usuarios (
                        UsuarioId INT IDENTITY PRIMARY KEY,
                        Username NVARCHAR(50) NOT NULL UNIQUE,
                        PasswordHash NVARCHAR(256) NOT NULL,
                        NombreCompleto NVARCHAR(120) NOT NULL,
                        Rol NVARCHAR(50) NOT NULL DEFAULT 'Administrador',
                        Activo BIT NOT NULL DEFAULT 1,
                        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
                    );
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Username = N'admin')
                BEGIN
                    INSERT INTO dbo.Usuarios (Username, PasswordHash, NombreCompleto, Rol, Activo)
                    VALUES (N'admin', N'admin123', N'Administrador General', N'Administrador', 1);
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Username = N'docente')
                BEGIN
                    INSERT INTO dbo.Usuarios (Username, PasswordHash, NombreCompleto, Rol, Activo)
                    VALUES (N'docente', N'docente123', N'Profesor Luis Flores', N'Docente', 1);
                END
                """;
            EjecutarComando(sql);
        }
        catch
        {
            // Si la base no está creada aún, no falla
        }
    }

    public static Models.UsuarioDto? ValidarLogin(string username, string password)
    {
        AsegurarTablaUsuarios();

        using var dt = EjecutarConsulta(
            "SELECT UsuarioId, Username, PasswordHash, NombreCompleto, Rol, Activo FROM dbo.Usuarios WHERE Username = @u AND Activo = 1",
            new SqlParameter("@u", username.Trim()));

        if (dt.Rows.Count == 0) return null;

        var row = dt.Rows[0];
        var storedHash = row["PasswordHash"].ToString() ?? "";

        bool passwordValido = storedHash == password ||
            storedHash.Equals(HashSha256(password), StringComparison.OrdinalIgnoreCase);

        if (!passwordValido) return null;

        return new Models.UsuarioDto(
            (int)row["UsuarioId"],
            row["Username"].ToString()!,
            row["NombreCompleto"].ToString()!,
            row["Rol"].ToString()!,
            (bool)row["Activo"]
        );
    }

    private static string HashSha256(string texto)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = System.Text.Encoding.UTF8.GetBytes(texto);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}

