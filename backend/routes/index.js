const router = require('express').Router();
const APIRoutes = require('./api');

router.use('/api', APIRoutes);

module.exports = router;
