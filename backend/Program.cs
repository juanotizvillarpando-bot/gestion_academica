using System.Data;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using GestionAcademica.Api.Data;
using GestionAcademica.Api.Models;

var candidates = new[]
{
    Path.Combine(AppContext.BaseDirectory, "wwwroot"),
    Path.Combine(Directory.GetCurrentDirectory(), "backend", "wwwroot"),
    Path.Combine(Directory.GetCurrentDirectory(), "GestionAcademica.Api", "wwwroot"),
    Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
    Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "wwwroot")
};

string webRoot = candidates.FirstOrDefault(Directory.Exists) ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = webRoot
});

// Cargar cadena de conexión desde appsettings.json
var connStr = builder.Configuration.GetConnectionString("GestionAcademica");
if (!string.IsNullOrWhiteSpace(connStr))
{
    DbHelper.ConnectionString = connStr;
}

// Configurar CORS para permitir comunicación con Vite en desarrollo (puerto 5173) o cualquier cliente
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
            ctx.Context.Response.Headers.Pragma = "no-cache";
            ctx.Context.Response.Headers.Expires = "0";
        }
    }
});

// Asegurar tabla y usuarios iniciales si la BD existe
DbHelper.AsegurarTablaUsuarios();

var api = app.MapGroup("/api");

// ----------------------------------------------------
// 0. AUTENTICACIÓN & SESIÓN
// ----------------------------------------------------
api.MapPost("/auth/login", (LoginRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new LoginResponse(false, null, null, "Debe ingresar usuario y contraseña."));

    var usuario = DbHelper.ValidarLogin(req.Username, req.Password);
    if (usuario == null)
        return Results.Json(new LoginResponse(false, null, null, "Credenciales inválidas. Verifica usuario y contraseña."), statusCode: 401);

    var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{usuario.Username}:{Guid.NewGuid():N}"));
    return Results.Ok(new LoginResponse(true, token, usuario, "Inicio de sesión correcto."));
});

// ----------------------------------------------------
// 1. REPORTE GENERAL & KPIs
// ----------------------------------------------------

api.MapGet("/reporte", () =>
{
    try
    {
        var (est, doc, mat, ins) = DbHelper.ObtenerKpis();
        var dt = DbHelper.ObtenerReporteGeneral();
        var items = new List<ReporteItemDto>();

        foreach (DataRow row in dt.Rows)
        {
            items.Add(new ReporteItemDto(
                Convert.ToInt32(row["InscripcionId"]),
                row["CodigoEstudiante"]?.ToString() ?? "",
                row["Estudiante"]?.ToString() ?? "",
                row["CodigoMateria"]?.ToString() ?? "",
                row["Materia"]?.ToString() ?? "",
                row["Docente"]?.ToString() ?? "",
                row["Periodo"]?.ToString() ?? "",
                row["NotaFinal"] != DBNull.Value ? Convert.ToDecimal(row["NotaFinal"]) : null,
                row["Estado"]?.ToString() ?? "Pendiente"
            ));
        }

        return Results.Ok(new KpiReporteDto(est, doc, mat, ins, items));
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

// ----------------------------------------------------
// 2. ESTUDIANTES
// ----------------------------------------------------
var estGroup = api.MapGroup("/estudiantes");

estGroup.MapGet("/", () =>
{
    try
    {
        var dt = DbHelper.ObtenerEstudiantes();
        var list = new List<EstudianteDto>();
        foreach (DataRow r in dt.Rows)
        {
            list.Add(new EstudianteDto(
                Convert.ToInt32(r["EstudianteId"]),
                r["Codigo"]?.ToString() ?? "",
                r["Nombres"]?.ToString() ?? "",
                r["Apellidos"]?.ToString() ?? ""
            ));
        }
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

estGroup.MapPost("/", (EstudianteDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombres))
        return Results.BadRequest(new { message = "El código y los nombres son obligatorios." });

    try
    {
        DbHelper.GuardarEstudiante(null, dto.Codigo.Trim(), dto.Nombres.Trim(), (dto.Apellidos ?? "").Trim());
        return Results.Ok(new { message = "Estudiante registrado con éxito." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

estGroup.MapPut("/{id:int}", (int id, EstudianteDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombres))
        return Results.BadRequest(new { message = "El código y los nombres son obligatorios." });

    try
    {
        DbHelper.GuardarEstudiante(id, dto.Codigo.Trim(), dto.Nombres.Trim(), (dto.Apellidos ?? "").Trim());
        return Results.Ok(new { message = "Estudiante actualizado correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

estGroup.MapDelete("/{id:int}", (int id) =>
{
    try
    {
        DbHelper.EliminarEstudiante(id);
        return Results.Ok(new { message = "Estudiante eliminado correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex, "eliminar este estudiante") });
    }
});

// ----------------------------------------------------
// 3. DOCENTES
// ----------------------------------------------------
var docGroup = api.MapGroup("/docentes");

docGroup.MapGet("/", () =>
{
    try
    {
        var dt = DbHelper.ObtenerDocentes();
        var list = new List<DocenteDto>();
        foreach (DataRow r in dt.Rows)
        {
            list.Add(new DocenteDto(
                Convert.ToInt32(r["DocenteId"]),
                r["Codigo"]?.ToString() ?? "",
                r["Nombres"]?.ToString() ?? "",
                r["Apellidos"]?.ToString() ?? ""
            ));
        }
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

docGroup.MapPost("/", (DocenteDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombres))
        return Results.BadRequest(new { message = "El código y los nombres son obligatorios." });

    try
    {
        DbHelper.GuardarDocente(null, dto.Codigo.Trim(), dto.Nombres.Trim(), (dto.Apellidos ?? "").Trim());
        return Results.Ok(new { message = "Docente registrado con éxito." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

docGroup.MapPut("/{id:int}", (int id, DocenteDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombres))
        return Results.BadRequest(new { message = "El código y los nombres son obligatorios." });

    try
    {
        DbHelper.GuardarDocente(id, dto.Codigo.Trim(), dto.Nombres.Trim(), (dto.Apellidos ?? "").Trim());
        return Results.Ok(new { message = "Docente actualizado correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

docGroup.MapDelete("/{id:int}", (int id) =>
{
    try
    {
        DbHelper.EliminarDocente(id);
        return Results.Ok(new { message = "Docente eliminado correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex, "eliminar este docente") });
    }
});

// ----------------------------------------------------
// 4. MATERIAS
// ----------------------------------------------------
var matGroup = api.MapGroup("/materias");

matGroup.MapGet("/", () =>
{
    try
    {
        var dt = DbHelper.ObtenerMaterias();
        var list = new List<MateriaDto>();
        foreach (DataRow r in dt.Rows)
        {
            list.Add(new MateriaDto(
                Convert.ToInt32(r["MateriaId"]),
                r["Codigo"]?.ToString() ?? "",
                r["Nombre"]?.ToString() ?? ""
            ));
        }
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

matGroup.MapPost("/", (MateriaDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombre))
        return Results.BadRequest(new { message = "El código y el nombre son obligatorios." });

    try
    {
        DbHelper.GuardarMateria(null, dto.Codigo.Trim(), dto.Nombre.Trim());
        return Results.Ok(new { message = "Materia registrada con éxito." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

matGroup.MapPut("/{id:int}", (int id, MateriaDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombre))
        return Results.BadRequest(new { message = "El código y el nombre son obligatorios." });

    try
    {
        DbHelper.GuardarMateria(id, dto.Codigo.Trim(), dto.Nombre.Trim());
        return Results.Ok(new { message = "Materia actualizada correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

matGroup.MapDelete("/{id:int}", (int id) =>
{
    try
    {
        DbHelper.EliminarMateria(id);
        return Results.Ok(new { message = "Materia eliminada del catálogo." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex, "eliminar esta materia") });
    }
});

// ----------------------------------------------------
// 5. PERIODOS
// ----------------------------------------------------
var perGroup = api.MapGroup("/periodos");

perGroup.MapGet("/", () =>
{
    try
    {
        var dt = DbHelper.ObtenerPeriodos();
        var list = new List<PeriodoDto>();
        foreach (DataRow r in dt.Rows)
        {
            list.Add(new PeriodoDto(
                Convert.ToInt32(r["PeriodoId"]),
                r["Codigo"]?.ToString() ?? "",
                Convert.ToDateTime(r["FechaInicio"]),
                Convert.ToDateTime(r["FechaFin"])
            ));
        }
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

perGroup.MapPost("/", (PeriodoDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo))
        return Results.BadRequest(new { message = "El código de periodo es obligatorio (ej. 2026-2)." });

    if (dto.FechaInicio.Date >= dto.FechaFin.Date)
        return Results.BadRequest(new { message = "La fecha de inicio debe ser anterior a la fecha de fin del semestre." });

    try
    {
        DbHelper.GuardarPeriodo(null, dto.Codigo.Trim(), dto.FechaInicio, dto.FechaFin);
        return Results.Ok(new { message = "Periodo académico registrado con éxito." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

perGroup.MapPut("/{id:int}", (int id, PeriodoDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Codigo))
        return Results.BadRequest(new { message = "El código de periodo es obligatorio (ej. 2026-2)." });

    if (dto.FechaInicio.Date >= dto.FechaFin.Date)
        return Results.BadRequest(new { message = "La fecha de inicio debe ser anterior a la fecha de fin del semestre." });

    try
    {
        DbHelper.GuardarPeriodo(id, dto.Codigo.Trim(), dto.FechaInicio, dto.FechaFin);
        return Results.Ok(new { message = "Periodo académico actualizado correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

perGroup.MapDelete("/{id:int}", (int id) =>
{
    try
    {
        DbHelper.EliminarPeriodo(id);
        return Results.Ok(new { message = "Periodo eliminado correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex, "eliminar este periodo") });
    }
});

// ----------------------------------------------------
// 6. OFERTAS ACADÉMICAS
// ----------------------------------------------------
var ofGroup = api.MapGroup("/ofertas");

ofGroup.MapGet("/", () =>
{
    try
    {
        var dt = DbHelper.ObtenerOfertas();
        var list = new List<OfertaDto>();
        foreach (DataRow r in dt.Rows)
        {
            list.Add(new OfertaDto(
                Convert.ToInt32(r["OfertaId"]),
                Convert.ToInt32(r["MateriaId"]),
                Convert.ToInt32(r["PeriodoId"]),
                Convert.ToInt32(r["DocenteId"]),
                r["Materia"]?.ToString(),
                r["Periodo"]?.ToString(),
                r["Docente"]?.ToString()
            ));
        }
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

ofGroup.MapGet("/combos", () =>
{
    try
    {
        var dtM = DbHelper.ObtenerMaterias();
        var materias = dtM.AsEnumerable().Select(r => new { Id = Convert.ToInt32(r["MateriaId"]), Nombre = r["Nombre"].ToString(), Codigo = r["Codigo"].ToString() });

        var dtD = DbHelper.EjecutarConsulta("SELECT DocenteId, CONCAT(Nombres, ' ', Apellidos) AS NombreCompleto, Codigo FROM dbo.Docentes ORDER BY Apellidos;");
        var docentes = dtD.AsEnumerable().Select(r => new { Id = Convert.ToInt32(r["DocenteId"]), Nombre = r["NombreCompleto"].ToString(), Codigo = r["Codigo"].ToString() });

        var dtP = DbHelper.ObtenerPeriodos();
        var periodos = dtP.AsEnumerable().Select(r => new { Id = Convert.ToInt32(r["PeriodoId"]), Codigo = r["Codigo"].ToString() });

        return Results.Ok(new { materias, docentes, periodos });
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

ofGroup.MapPost("/", (OfertaDto dto) =>
{
    if (dto.MateriaId <= 0 || dto.DocenteId <= 0 || dto.PeriodoId <= 0)
        return Results.BadRequest(new { message = "Debes seleccionar Materia, Docente y Periodo." });

    try
    {
        DbHelper.GuardarOferta(null, dto.MateriaId, dto.PeriodoId, dto.DocenteId);
        return Results.Ok(new { message = "Oferta académica asignada con éxito." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

ofGroup.MapPut("/{id:int}", (int id, OfertaDto dto) =>
{
    if (dto.MateriaId <= 0 || dto.DocenteId <= 0 || dto.PeriodoId <= 0)
        return Results.BadRequest(new { message = "Debes seleccionar Materia, Docente y Periodo." });

    try
    {
        DbHelper.GuardarOferta(id, dto.MateriaId, dto.PeriodoId, dto.DocenteId);
        return Results.Ok(new { message = "Oferta académica actualizada." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

ofGroup.MapDelete("/{id:int}", (int id) =>
{
    try
    {
        DbHelper.EliminarOferta(id);
        return Results.Ok(new { message = "Oferta académica eliminada." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex, "eliminar esta oferta") });
    }
});

// ----------------------------------------------------
// 7. INSCRIPCIONES
// ----------------------------------------------------
var insGroup = api.MapGroup("/inscripciones");

insGroup.MapGet("/", () =>
{
    try
    {
        var dt = DbHelper.ObtenerInscripciones();
        var list = new List<InscripcionDto>();
        foreach (DataRow r in dt.Rows)
        {
            list.Add(new InscripcionDto(
                Convert.ToInt32(r["InscripcionId"]),
                Convert.ToInt32(r["EstudianteId"]),
                Convert.ToInt32(r["OfertaId"]),
                r["NotaFinal"] != DBNull.Value ? Convert.ToDecimal(r["NotaFinal"]) : null,
                r["Estudiante"]?.ToString(),
                r["Oferta"]?.ToString()
            ));
        }
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

insGroup.MapGet("/combos", () =>
{
    try
    {
        var dtE = DbHelper.EjecutarConsulta("SELECT EstudianteId, CONCAT(Nombres, ' ', Apellidos, ' (', Codigo, ')') AS NombreCompleto FROM dbo.Estudiantes ORDER BY Apellidos;");
        var estudiantes = dtE.AsEnumerable().Select(r => new { Id = Convert.ToInt32(r["EstudianteId"]), Nombre = r["NombreCompleto"].ToString() });

        var dtO = DbHelper.EjecutarConsulta("""
            SELECT o.OfertaId, CONCAT(m.Nombre, ' - ', p.Codigo, ' [Prof: ', d.Nombres, ' ', d.Apellidos, ']') AS Descripcion
            FROM dbo.OfertasAcademicas o
            JOIN dbo.Materias m ON m.MateriaId = o.MateriaId
            JOIN dbo.Periodos p ON p.PeriodoId = o.PeriodoId
            JOIN dbo.Docentes d ON d.DocenteId = o.DocenteId
            ORDER BY p.Codigo DESC, m.Nombre;
            """);
        var ofertas = dtO.AsEnumerable().Select(r => new { Id = Convert.ToInt32(r["OfertaId"]), Descripcion = r["Descripcion"].ToString() });

        return Results.Ok(new { estudiantes, ofertas });
    }
    catch (Exception ex)
    {
        return Results.Problem(DbHelper.FormatearErrorSql(ex));
    }
});

insGroup.MapPost("/", (InscripcionDto dto) =>
{
    if (dto.EstudianteId <= 0 || dto.OfertaId <= 0)
        return Results.BadRequest(new { message = "Debes seleccionar un estudiante y una oferta académica." });

    if (dto.NotaFinal.HasValue && (dto.NotaFinal < 0 || dto.NotaFinal > 100))
        return Results.BadRequest(new { message = "La nota debe estar entre 0.00 y 100.00." });

    try
    {
        DbHelper.GuardarInscripcion(null, dto.EstudianteId, dto.OfertaId, dto.NotaFinal);
        return Results.Ok(new { message = "Matrícula registrada exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

insGroup.MapPut("/{id:int}", (int id, InscripcionDto dto) =>
{
    if (dto.EstudianteId <= 0 || dto.OfertaId <= 0)
        return Results.BadRequest(new { message = "Debes seleccionar un estudiante y una oferta académica." });

    if (dto.NotaFinal.HasValue && (dto.NotaFinal < 0 || dto.NotaFinal > 100))
        return Results.BadRequest(new { message = "La nota debe estar entre 0.00 y 100.00." });

    try
    {
        DbHelper.GuardarInscripcion(id, dto.EstudianteId, dto.OfertaId, dto.NotaFinal);
        return Results.Ok(new { message = "Inscripción actualizada correctamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

insGroup.MapPatch("/{id:int}/nota", (int id, ActualizarNotaRequest req) =>
{
    if (req.NotaFinal.HasValue && (req.NotaFinal < 0 || req.NotaFinal > 100))
        return Results.BadRequest(new { message = "La calificación debe ser un valor entre 0.00 y 100.00." });

    try
    {
        DbHelper.ActualizarNota(id, req.NotaFinal);
        return Results.Ok(new { message = "Calificación actualizada exitosamente." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex) });
    }
});

insGroup.MapDelete("/{id:int}", (int id) =>
{
    try
    {
        DbHelper.EliminarInscripcion(id);
        return Results.Ok(new { message = "Inscripción eliminada." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = DbHelper.FormatearErrorSql(ex, "eliminar esta inscripción") });
    }
});

// ----------------------------------------------------
// 8. CONFIGURACIÓN Y BASE DE DATOS
// ----------------------------------------------------
var cfgGroup = api.MapGroup("/configuracion");

cfgGroup.MapGet("/", () =>
{
    var (ok, msg) = DbHelper.ProbarConexion();
    var b = new SqlConnectionStringBuilder(DbHelper.ConnectionString);

    return Results.Ok(new
    {
        conectado = ok,
        mensaje = msg,
        servidor = b.DataSource,
        baseDatos = b.InitialCatalog,
        windowsAuth = b.IntegratedSecurity,
        usuario = b.UserID
    });
});

cfgGroup.MapPost("/probar", (ConfiguracionRequest req) =>
{
    var b = new SqlConnectionStringBuilder
    {
        DataSource = req.Servidor.Trim(),
        InitialCatalog = req.BaseDatos.Trim(),
        TrustServerCertificate = true
    };
    if (req.WindowsAuth)
    {
        b.IntegratedSecurity = true;
    }
    else
    {
        b.IntegratedSecurity = false;
        b.UserID = req.Usuario?.Trim() ?? "sa";
        b.Password = req.Password ?? "";
    }

    var (ok, msg) = DbHelper.ProbarConexion(b.ConnectionString);
    return Results.Ok(new { exito = ok, mensaje = msg });
});

cfgGroup.MapPost("/guardar", (ConfiguracionRequest req) =>
{
    var b = new SqlConnectionStringBuilder
    {
        DataSource = req.Servidor.Trim(),
        InitialCatalog = req.BaseDatos.Trim(),
        TrustServerCertificate = true
    };
    if (req.WindowsAuth)
    {
        b.IntegratedSecurity = true;
    }
    else
    {
        b.IntegratedSecurity = false;
        b.UserID = req.Usuario?.Trim() ?? "sa";
        b.Password = req.Password ?? "";
    }

    var (ok, msg) = DbHelper.ProbarConexion(b.ConnectionString);
    if (!ok)
    {
        return Results.BadRequest(new { message = $"No se pudo conectar: {msg}" });
    }

    DbHelper.ConnectionString = b.ConnectionString;

    try
    {
        var appSettingsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json");
        var json = $"{{\n  \"ConnectionStrings\": {{\n    \"GestionAcademica\": \"{b.ConnectionString.Replace("\\", "\\\\")}\"\n  }}\n}}";
        File.WriteAllText(appSettingsPath, json);
    }
    catch { }

    return Results.Ok(new { message = "Configuración de conexión guardada exitosamente." });
});

cfgGroup.MapPost("/inicializar", () =>
{
    string baseDir = AppDomain.CurrentDomain.BaseDirectory;
    string[] candidatosBase = {
        Path.Combine(baseDir, "..", "..", "..", "..", "BaseDeDatos", "01_CrearBase.sql"),
        Path.Combine(baseDir, "..", "BaseDeDatos", "01_CrearBase.sql"),
        Path.Combine(baseDir, "BaseDeDatos", "01_CrearBase.sql"),
        Path.Combine(Directory.GetCurrentDirectory(), "BaseDeDatos", "01_CrearBase.sql"),
        Path.Combine(Directory.GetCurrentDirectory(), "..", "BaseDeDatos", "01_CrearBase.sql")
    };

    string? rutaBase = candidatosBase.FirstOrDefault(File.Exists);

    string[] candidatosDatos = {
        Path.Combine(baseDir, "..", "..", "..", "..", "BaseDeDatos", "02_DatosDePrueba.sql"),
        Path.Combine(baseDir, "..", "BaseDeDatos", "02_DatosDePrueba.sql"),
        Path.Combine(baseDir, "BaseDeDatos", "02_DatosDePrueba.sql"),
        Path.Combine(Directory.GetCurrentDirectory(), "BaseDeDatos", "02_DatosDePrueba.sql"),
        Path.Combine(Directory.GetCurrentDirectory(), "..", "BaseDeDatos", "02_DatosDePrueba.sql")
    };

    string? rutaDatos = candidatosDatos.FirstOrDefault(File.Exists);

    if (rutaBase == null)
    {
        return Results.BadRequest(new { message = "No se encontró el archivo de script 01_CrearBase.sql." });
    }

    var (ok, msg) = DbHelper.InicializarBaseDeDatos(rutaBase, rutaDatos ?? "");
    if (ok)
    {
        return Results.Ok(new { message = "¡Base de datos y tablas inicializadas con éxito en SQL Server!" });
    }
    else
    {
        return Results.BadRequest(new { message = msg });
    }
});

// Fallback a index.html para soportar navegación SPA de React
app.MapFallbackToFile("index.html");

app.Run();
