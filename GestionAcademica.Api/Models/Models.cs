using System;

namespace GestionAcademica.Api.Models;

public record EstudianteDto(int? EstudianteId, string Codigo, string Nombres, string Apellidos);

public record DocenteDto(int? DocenteId, string Codigo, string Nombres, string Apellidos);

public record MateriaDto(int? MateriaId, string Codigo, string Nombre);

public record PeriodoDto(int? PeriodoId, string Codigo, DateTime FechaInicio, DateTime FechaFin);

public record OfertaDto(int? OfertaId, int MateriaId, int PeriodoId, int DocenteId, string? Materia = null, string? Periodo = null, string? Docente = null);

public record InscripcionDto(int? InscripcionId, int EstudianteId, int OfertaId, decimal? NotaFinal, string? Estudiante = null, string? Oferta = null);

public record ActualizarNotaRequest(decimal? NotaFinal);

public record ConfiguracionRequest(string Servidor, string BaseDatos, bool WindowsAuth, string? Usuario, string? Password);

public record KpiReporteDto(
    int TotalEstudiantes,
    int TotalDocentes,
    int TotalMaterias,
    int TotalInscripciones,
    IEnumerable<ReporteItemDto> Items
);

public record ReporteItemDto(
    int InscripcionId,
    string CodigoEstudiante,
    string Estudiante,
    string CodigoMateria,
    string Materia,
    string Docente,
    string Periodo,
    decimal? NotaFinal,
    string Estado
);

public record UsuarioDto(
    int UsuarioId,
    string Username,
    string NombreCompleto,
    string Rol,
    bool Activo
);

public record LoginRequest(string Username, string Password);

public record LoginResponse(
    bool Exitoso,
    string? Token,
    UsuarioDto? Usuario,
    string? Mensaje
);

