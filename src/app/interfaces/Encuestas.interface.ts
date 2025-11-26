export interface Encuesta {
    id: string;
    titulo: string;
    Preguntas: Pregunta[];
    descripcion: string;
    estado: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    creatorUserId: number;
  }
  
  export interface Pregunta {
    id: number;
    encuestaId: number;
    descripcion: string;
    multiplesRespuestas: boolean;
    creatorUserId: number;
    Respuestas: Respuesta[];
  }
  
  export interface Respuesta {
    id: number;
    preguntaId: number;
    descripcion: string;
    creatorUserId: number;
  }