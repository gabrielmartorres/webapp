'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_del_curso_de_angular4avanzado';

exports.ensureAuth = function(req, res, next){
	if(!req.headers.authorization){
		return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
	}

	var token = req.headers.authorization.replace(/['"]+/g, '');

	try{
		var payload = jwt.decode(token, secret);

		if(payload.exp <= moment().unix()){
			return res.status(401).send({
				message: 'El token ha expirado'
			});
		}
	}catch(ex){
		return res.status(404).send({
				message: 'El token no válido'
		});
	}

	req.user = payload;

	next();
};