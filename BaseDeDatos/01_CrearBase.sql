-- Abrir en SSMS y ejecutar el archivo completo.
USE master;
GO
IF DB_ID(N'gestion academica') IS NULL
    CREATE DATABASE [gestion academica];
GO
USE [gestion academica];
GO
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Estudiantes', N'U') IS NULL
        CREATE TABLE dbo.Estudiantes (
            EstudianteId INT IDENTITY PRIMARY KEY,
            Codigo NVARCHAR(20) NOT NULL UNIQUE,
            Nombres NVARCHAR(80) NOT NULL,
            Apellidos NVARCHAR(80) NOT NULL
        );

    IF OBJECT_ID(N'dbo.Docentes', N'U') IS NULL
        CREATE TABLE dbo.Docentes (
            DocenteId INT IDENTITY PRIMARY KEY,
            Codigo NVARCHAR(20) NOT NULL UNIQUE,
            Nombres NVARCHAR(80) NOT NULL,
            Apellidos NVARCHAR(80) NOT NULL
        );

    IF OBJECT_ID(N'dbo.Materias', N'U') IS NULL
        CREATE TABLE dbo.Materias (
            MateriaId INT IDENTITY PRIMARY KEY,
            Codigo NVARCHAR(20) NOT NULL UNIQUE,
            Nombre NVARCHAR(120) NOT NULL
        );

    IF OBJECT_ID(N'dbo.Periodos', N'U') IS NULL
        CREATE TABLE dbo.Periodos (
            PeriodoId INT IDENTITY PRIMARY KEY,
            Codigo NVARCHAR(20) NOT NULL UNIQUE,
            FechaInicio DATE NOT NULL,
            FechaFin DATE NOT NULL,
            CONSTRAINT CK_Periodos_Fechas CHECK (FechaInicio <= FechaFin)
        );

    IF OBJECT_ID(N'dbo.OfertasAcademicas', N'U') IS NULL
        CREATE TABLE dbo.OfertasAcademicas (
            OfertaId INT IDENTITY PRIMARY KEY,
            MateriaId INT NOT NULL REFERENCES dbo.Materias(MateriaId),
            PeriodoId INT NOT NULL REFERENCES dbo.Periodos(PeriodoId),
            DocenteId INT NOT NULL REFERENCES dbo.Docentes(DocenteId),
            CONSTRAINT UQ_Ofertas_MateriaPeriodo UNIQUE (MateriaId, PeriodoId)
        );

    IF OBJECT_ID(N'dbo.Inscripciones', N'U') IS NULL
        CREATE TABLE dbo.Inscripciones (
            InscripcionId INT IDENTITY PRIMARY KEY,
            EstudianteId INT NOT NULL REFERENCES dbo.Estudiantes(EstudianteId),
            OfertaId INT NOT NULL REFERENCES dbo.OfertasAcademicas(OfertaId),
            NotaFinal DECIMAL(5,2) NULL,
            CONSTRAINT UQ_Inscripciones_EstudianteOferta UNIQUE (EstudianteId, OfertaId),
            CONSTRAINT CK_Inscripciones_Nota CHECK (NotaFinal BETWEEN 0 AND 100)
        );

    IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
        CREATE TABLE dbo.Usuarios (
            UsuarioId INT IDENTITY PRIMARY KEY,
            Username NVARCHAR(50) NOT NULL UNIQUE,
            PasswordHash NVARCHAR(256) NOT NULL,
            NombreCompleto NVARCHAR(120) NOT NULL,
            Rol NVARCHAR(50) NOT NULL DEFAULT 'Administrador',
            Activo BIT NOT NULL DEFAULT 1,
            FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
        );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

