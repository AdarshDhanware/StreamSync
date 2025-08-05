import swaggerAutogen from 'swagger-autogen';

const swagger = swaggerAutogen();

const doc = {
  info: {
    title: 'VidTube API',
    description: 'Auto-generated Swagger Docs for VidTube backend',
  },
  host: 'localhost:8000',
  schemes: ['http'],
};

const outputFile = './docs/swagger-output.json';

const endpointsFiles = [
  './src/app.js', // or index.js or main server entry
  './src/routes/user.routes.js',
  './src/routes/healthcheck.routes.js',
  './src/routes/tweets.routes.js',
  './src/routes/subscriptions.routes.js',
  './src/routes/videos.routes.js',
  './src/routes/comment.routes.js',
  './src/routes/likes.routes.js',
  './src/routes/playlist.routes.js',
  './src/routes/dashboard.routes.js',
];

swagger(outputFile, endpointsFiles, doc);
