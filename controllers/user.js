'use strict'

// Modulos
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');
var path = require('path');

// Modelos
var User = require('../models/user');

// Servicio jwt
var jwt = require('../services/jwt');

// Acciones
function pruebas(req, res){
	res.status(200).send({
		message: 'Probando el controlador de usuarios y la acción pruebas',
		user: req.user
	});
}

function saveUser(req, res){

	// Crear el objeto del usuario
	var user = new User();

	// Recoger parametro de la petición
	var params = req.body;

	//console.log(params);

	if(params.password && params.name && params.surname && params.email){
		
		// Asignar valores al objeto de usuario
		user.name = params.name;
		user.surname = params.surname;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;

		User.findOne({email: user.email.toLowerCase()}, (err, issetUser) => {
			if(err){
				res.status(500).send({message: 'Error al comprobar el usuario'});
			}else{
				if(!issetUser){

					// Cifrar la contraseña
					bcrypt.hash(params.password, null, null, function(err, hash){
						user.password = hash;

						// Guardar usuario en la bd
						user.save((err, userStored) => {
							if(err){
								res.status(500).send({message: 'Error al Guardar el usuario'});
							}else{
								if(!userStored){
									res.status(404).send({message: 'NO se ha registrado el usuario'});	
								}else{
									res.status(200).send({user: userStored});
								}
							}
						});

					});

				}else{
					res.status(200).send(
						{message: 'El usuario no puede registrarse'
					});
				}
			}
		});
			
		
	}else{
		res.status(200).send({
			message: 'Introduce los datos correctamente para poder registrar al usuario'
		});
	}
}

function login(req, res){
	var params = req.body;

	var email = params.email;
	var password = params.password;

	// Busca y encuentra un documento cuyo email llega por post
	User.findOne({email: email.toLowerCase()}, (err, user) => {
		if(err){
			res.status(500).send({message: 'Error al comprobar el usuario'});
		}else{
			if(user){
				bcrypt.compare(password, user.password, (err, check) => {
					if(check){

						// Comprobar y generar el token
						if(params.gettoken){
							// Devolver el token jwt
							res.status(200).send({
								token: jwt.createToken(user)
							});
						}else{
							res.status(200).send({user});
						}
						

					}else{
						res.status(404).send({
							message: 'El usuario no ha podido loguearse correctamente'
						});
					}
				});

				
			}else{
				res.status(404).send({
					message: 'El usuario no ha podido loguearse'
				});
			}
		}
	});

}

function updateUser(req, res){
	var userId = req.params.id;
	var update = req.body;
	delete update.password;

	// Comprobamos que el usuario es igual al usuario que esté logueado.
	if(userId != req.user.sub){
		return res.status(500).send({message: 'No tienes permiso para actualizar el usuario'});
	}

	User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {
		if(err){
			res.status(500).send({
				message: 'Error al actualizar usuario'
			});
		}else{
			if(!userUpdated){
				res.status(404).send({
					message: 'No se ha podido actualizar usuario'
				});
			}else{
				res.status(200).send({user: userUpdated});
			}
		}
	});
	
}

function uploadImage(req, res){
	var userId = req.params.id;
	var file_name = 'No subido';

	if(req.files){
		var file_path = req.files.image.path;
		var file_split = file_path.split('/');
		var file_name = file_split[2];

		var ext_split = file_name.split('.');
		var file_ext = ext_split[1];

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gift'){

			if(userId != req.user.sub){
				return res.status(500).send({message: 'No tienes permiso para actualizar el usuario'});
			}

			User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdated) => {
				if(err){
					res.status(500).send({
						message: 'Error al actualizar usuario'
					});
				}else{
					if(!userUpdated){
						res.status(404).send({
							message: 'No se ha podido actualizar usuario'
						});
					}else{
						res.status(200).send({user: userUpdated, image: file_name});
					}
				}
			});

		}else{
			fs.unlink(file_path, (err) => {
				if(err){
					res.status(200).send({
						message: 'Extensión no valida y fichero no borrado'
					});
				}else{
					res.status(200).send({
						message: 'Extensión no valida'
					});
				}	
			});

			
		}

		/*
		res.status(200).send({
			file_path: file_path,
			file_split: file_split,
			file_name: file_name
		});
		*/

	}else{
		res.status(200).send({
				message: 'No se han subido archivos'
		});
	}
}

function getImageFile(req, res){
	var imageFile = req.params.imageFile;
	var path_file = './uploads/users/'+imageFile;

	fs.exists(path_file, function(exists){
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(404).send({
				message: 'La imagen no existe'
			});
		}
	});

}


function getKeepers(req, res){
	User.find({role:'ROLE_ADMIN'}).exec((err, users) =>{
		if(err){
			res.status(500).send({
				message: 'Error en la petición'
			});
		}else{
			if(!users){
				res.status(500).send({
					message: 'No hay cuidadores'
				});
			}else{
				res.status(200).send({users});
			}
		}
	});

	
}

module.exports = {
	pruebas,
	saveUser,
	login,
	updateUser,
	uploadImage,
	getImageFile,
	getKeepers
};