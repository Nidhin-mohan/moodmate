import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MoodMate API',
      version: '1.0.0',
      description: 'API documentation for MoodMate mood tracking application',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        CreateMoodLog: {
          type: 'object',
          required: ['mood'],
          properties: {
            mood: { type: 'string' },
            specificEmotion: { type: 'string' },
            intensity: { type: 'integer', minimum: 1, maximum: 10 },
            energyLevel: { type: 'integer', minimum: 1, maximum: 10 },
            tagsPeople: { type: 'array', items: { type: 'string' } },
            tagsPlaces: { type: 'array', items: { type: 'string' } },
            tagsEvents: { type: 'array', items: { type: 'string' } },
            sleepHours: { type: 'number', minimum: 0, maximum: 24 },
            sleepQuality: { type: 'integer', minimum: 1, maximum: 5 },
            exercise: { type: 'boolean' },
            notes: { type: 'string', maxLength: 2000 },
            reflections: { type: 'string', maxLength: 2000 },
            date: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errorCode: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
  },
  // swagger-jsdoc scans these files for @openapi JSDoc comments
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
