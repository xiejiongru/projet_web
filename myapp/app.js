var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dataRouter = require('./routes/data'); // Add data route

const app = express(); // Ensure express is initialized

app.use('/api', indexRouter);
app.use('/data', dataRouter); // Use data route

const cors = require('cors');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(cors());

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = 3000;
const maxPortAttempts = 10; // Maximum port attempts

function startServer(port, attempts = 0) {
    app.listen(port, () => {
        console.log(`Backend running at http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            if (attempts < maxPortAttempts) {
                const newPort = port + 1;
                console.log(`Port ${port} is in use, trying another port ${newPort}...`);
                startServer(newPort, attempts + 1);
            } else {
                console.error('❌ Maximum port attempts reached, unable to start server');
            }
        } else {
            console.error('❌ Error starting server:', err);
        }
    });
}

startServer(port);

module.exports = app;