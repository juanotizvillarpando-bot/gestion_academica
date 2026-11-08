USE [gestion academica];
GO
SET XACT_ABORT ON;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM dbo.Estudiantes WHERE Codigo = N'EST-001')
        INSERT dbo.Estudiantes (Codigo, Nombres, Apellidos)
        VALUES (N'EST-001', N'Ana', N'Rojas');

    IF NOT EXISTS (SELECT 1 FROM dbo.Docentes WHERE Codigo = N'DOC-001')
        INSERT dbo.Docentes (Codigo, Nombres, Apellidos)
        VALUES (N'DOC-001', N'Luis', N'Flores');

    IF NOT EXISTS (SELECT 1 FROM dbo.Materias WHERE Codigo = N'MAT-001')
        INSERT dbo.Materias (Codigo, Nombre)
        VALUES (N'MAT-001', N'Programación I');

    IF NOT EXISTS (SELECT 1 FROM dbo.Periodos WHERE Codigo = N'2026-2')
        INSERT dbo.Periodos (Codigo, FechaInicio, FechaFin)
        VALUES (N'2026-2', '20260801', '20261215');

    DECLARE @EstudianteId INT = (SELECT EstudianteId FROM dbo.Estudiantes WHERE Codigo = N'EST-001');
    DECLARE @DocenteId INT = (SELECT DocenteId FROM dbo.Docentes WHERE Codigo = N'DOC-001');
    DECLARE @MateriaId INT = (SELECT MateriaId FROM dbo.Materias WHERE Codigo = N'MAT-001');
    DECLARE @PeriodoId INT = (SELECT PeriodoId FROM dbo.Periodos WHERE Codigo = N'2026-2');

    IF NOT EXISTS (
        SELECT 1 FROM dbo.OfertasAcademicas
        WHERE MateriaId = @MateriaId AND PeriodoId = @PeriodoId
    )
        INSERT dbo.OfertasAcademicas (MateriaId, PeriodoId, DocenteId)
        VALUES (@MateriaId, @PeriodoId, @DocenteId);

    DECLARE @OfertaId INT = (
        SELECT OfertaId FROM dbo.OfertasAcademicas
        WHERE MateriaId = @MateriaId AND PeriodoId = @PeriodoId
    );

    IF NOT EXISTS (
        SELECT 1 FROM dbo.Inscripciones
        WHERE EstudianteId = @EstudianteId AND OfertaId = @OfertaId
    )
        INSERT dbo.Inscripciones (EstudianteId, OfertaId, NotaFinal)
        VALUES (@EstudianteId, @OfertaId, 85.00);

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Username = N'admin')
        INSERT dbo.Usuarios (Username, PasswordHash, NombreCompleto, Rol, Activo)
        VALUES (N'admin', N'admin123', N'Administrador General', N'Administrador', 1);

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Username = N'docente')
        INSERT dbo.Usuarios (Username, PasswordHash, NombreCompleto, Rol, Activo)
        VALUES (N'docente', N'docente123', N'Profesor Luis Flores', N'Docente', 1);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    THROW;
END CATCH;

SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

SELECT CONCAT(e.Nombres, N' ', e.Apellidos) AS Estudiante,
       m.Nombre AS Materia,
       CONCAT(d.Nombres, N' ', d.Apellidos) AS Docente,
       p.Codigo AS Periodo,
       i.NotaFinal
FROM dbo.Inscripciones AS i
JOIN dbo.Estudiantes AS e ON e.EstudianteId = i.EstudianteId
JOIN dbo.OfertasAcademicas AS o ON o.OfertaId = i.OfertaId
JOIN dbo.Materias AS m ON m.MateriaId = o.MateriaId
JOIN dbo.Docentes AS d ON d.DocenteId = o.DocenteId
JOIN dbo.Periodos AS p ON p.PeriodoId = o.PeriodoId
WHERE i.EstudianteId = @EstudianteId AND i.OfertaId = @OfertaId;
