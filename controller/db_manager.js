var baseDatos = {

	//Conectarse a la base de datos o crear una nueva
    abrirBD: function(){
        var db = openDatabase('dibam', '1.0', 'Dibam', 100 * 1024);
        return db;
    },
	//Creacion de Tablas
    tablaSolicitudesPorEnviar:function(tx){
        tx.executeSql('create table if not exists Solicitudes_por_enviar (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, isbn, nombre_libro, valor_referencia, cantidad, autor, idPresupuesto, idUsuario )');
        console.log('tabla Solicitudes_por_enviar creada');
    },
    tablaPresupuestos:function(tx){
        //tx.executeSql('create table if not exists Presupuestos (id unique, nombre, total, disponible, utilizado,fechaValido)');
        tx.executeSql('create table if not exists Presupuestos (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, idPresupuesto, nombrePresupuesto, totalPresupuesto, disponiblePresupuesto, utilizado,fechaValidoHasta, idUsuario)');
        console.log('tabla presupuesto creada');
    },

    tablaUsuario: function(){
        //id INTEGER PRIMARY KEY
        tx.executeSql('create table if not exists Usuario (id unique, nombre, nombreBiblioteca, idPresupuesto)');
        console.log('tabla Usuario creada');
    },

    //inserts
	agregarSolicitud: function(tx, libro, idPresupuesto){
		var valor_referencia = libro.valor_referencia.replace('.','').replace(',','');
        window.montoUtilizado = window.montoUtilizado + (valor_referencia*1);
        // var idPresupuesto = 1;
        //var idPresupuesto = window.usuario.evento.id;
        console.log('Valor: '+(valor_referencia*1)*libro.cantidad);
        var utilizado = (valor_referencia*1)*libro.cantidad;
        tx.executeSql('insert into Solicitudes_por_enviar (isbn, nombre_libro, valor_referencia, cantidad, autor, idPresupuesto, idUsuario) values ('+libro.isbn+', "'+libro.nombre_libro+'", '+valor_referencia+', '+libro.cantidad+', "'+libro.autor+'", '+idPresupuesto+','+window.usuario.id+')');
        tx.executeSql('update Presupuestos set utilizado = (select utilizado from Presupuestos where idPresupuesto='+idPresupuesto+')+'+utilizado+', disponiblePresupuesto = (select disponiblePresupuesto from Presupuestos where idPresupuesto='+idPresupuesto+')-'+utilizado+' WHERE idPresupuesto = '+idPresupuesto);
        baseDatos.obtenerPresupuestoId(tx, window.usuario);
    },

    agregarPresupuesto: function(tx, presupuesto, idUsuario){
    	console.log(presupuesto);
        // var fecha = new Date(presupuesto.fechaValidoHasta).toLocaleDateString();
        //var fecha = new Date(presupuesto.fechaValidoHasta).toString();
        tx.executeSql('insert into Presupuestos (idPresupuesto, nombrePresupuesto, totalPresupuesto, disponiblePresupuesto, utilizado,fechaValidoHasta, idUsuario) VALUES ('+presupuesto.id+',"'+presupuesto.nombrePresupuesto+'",'+presupuesto.totalPresupuesto+','+presupuesto.disponiblePresupuesto+','+presupuesto.utilizado+',"'+presupuesto.fechaValidoHasta+'",'+idUsuario+')');
        // document.getElementById('presupuestoValidoHasta').innerHTML = fecha;
        // document.getElementById('presupuestoDisponible').innerHTML = presupuesto.disponiblePresupuesto;
        // document.getElementById('presupuestoUtilizado').innerHTML = presupuesto.utilizado;
    },

    //Updates
    updatePresupuesto: function(tx, valor, idPresupuesto){
        tx.executeSql('update Presupuestos set utilizado ='+valor+' WHERE idPresupuesto = '+idPresupuesto+';', [], baseDatos.succesUpdateDisponible, baseDatos.errorTransaccion);
    },

    //Consultas
    verificarLibro: function(tx, libro, usuario){
    	tx.executeSql('select * from Solicitudes_por_enviar where isbn='+libro.isbn+' and idUsuario='+usuario.id, [], function(tx, results){
    		if(results.rows.length == 0){
    			console.log('agregado');   			
    			baseDatos.agregarSolicitud(tx, libro, usuario.evento.id);
    		}else{
    			alert('el libro ya se encuentra agregado');
    		}
    	}, baseDatos.errorGuardar);
    },

    verificarPresupuesto: function(tx, presupuesto, idUsuario){
    	tx.executeSql('select * from Presupuestos where idPresupuesto='+presupuesto.id+' and idUsuario='+idUsuario, [], function(tx, results){
    		if(results.rows.length == 0){
    			console.log('agregado');   			
    			baseDatos.agregarPresupuesto(tx, presupuesto, idUsuario);
                app.construirResumen(presupuesto);
    		}else{
                var len = results.rows.length;
    			console.log('ya existe');
                for (var i=0; i<len; i++){
                    var r = results.rows.item(i);
                    app.construirResumen(r);
                    // document.getElementById('presupuestoValidoHasta').innerHTML = r.fechaValido
                    // document.getElementById('presupuestoDisponible').innerHTML = r.disponible
                    // document.getElementById('presupuestoUtilizado').innerHTML = r.utilizado;
                }
                
    			//alert('el libro ya se encuentra agregado');
    		}
    	}, baseDatos.errorGuardar);
    },

    // obtenerPresupuesto: function(tx){
    // 	tx.executeSql('select * from Presupuestos', [], baseDatos.successPresupuestos, app.errorCB);
    // },

    obtenerPresupuestoId: function(tx, usuario){
        tx.executeSql('select * from Presupuestos where idUsuario= '+usuario.id+' and idPresupuesto='+usuario.evento.id, [], baseDatos.successPresupuestos, baseDatos.errorObteniendoPresupuesto);
    },

    // obtenerSolicitudesPorEnviar: function(tx, idPresupuesto) {
    //     tx.executeSql('select * from Solicitudes_por_enviar where idPresupuesto='+idPresupuesto, [], baseDatos.successSolicitudesPorEnviar, baseDatos.errorCB);
    // },

    obtenerSolicitudesPorEnviar: function(tx, usuario) {
        tx.executeSql('select * from Solicitudes_por_enviar where idUsuario='+usuario.id+' and idPresupuesto='+usuario.evento.id, [], baseDatos.successSolicitudesPorEnviar, baseDatos.errorCB);
    },

    obtenerLibroSolicitudesPorEnviar: function(tx, libros, usuario) {
        tx.executeSql('select * from Solicitudes_por_enviar where idUsuario='+usuario.id, [], baseDatos.successBuscarLibroEnvio, baseDatos.errorCB);
        // tx.executeSql('select * from Solicitudes_por_enviar where idUsuario='+usuario.id, [], function(tx, results){
        //     var len = results.rows.length;
        //     var encontrados = new Array(len);
        //     if(len >= 1){
        //         for (var x=0; x<len; x++){
        //             encontrados[x] = results.rows.item(x);
        //         }
        //     }
        //     app.librosEncontrados(encontrados);
        // }, baseDatos.errorCB);
        // tx.executeSql('select * from Solicitudes_por_enviar where isbn='+isbn+' and idUsuario='+usuario.id, [], baseDatos.successLibroSolicitudesPorEnviar, baseDatos.errorCB);
        
    },

    // obtenerLibroSolicitudesPorEnviar: function(tx, libros, usuario) {
    //     for(var i= 0; i< libros.length; i++){
    //         tx.executeSql('select * from Solicitudes_por_enviar where isbn='+libros[i].codigoISBN+' and idUsuario='+usuario.id, [], function(tx, results){
    //             var len = results.rows.length;
    //             if(len >= 1){
    //                 for (var x=0; x<len; x++){
    //                     var r = results.rows.item(x);
    //                     console.log(r);
    //                     libros[i].Titulo= r.nombre_libro;
    //                     libros[i].Autor = r.cantidad;
    //                     libros[i].Cantidad= r.cantidad;
    //                     libros[i].Precio = r.valor_referencia;
    //                 }
    //             }

    //         }, baseDatos.errorCB);
    //     } 
    //     console.log(libros);
    //     // tx.executeSql('select * from Solicitudes_por_enviar where isbn='+isbn+' and idUsuario='+usuario.id, [], baseDatos.successLibroSolicitudesPorEnviar, baseDatos.errorCB);
        
    // },

	borrarLibro: function(tx, usuario) {
        tx.executeSql('delete from Solicitudes_por_enviar where idUsuario='+usuario.id, [], baseDatos.successBorrarLibro, baseDatos.errorBorrarLibro);
    },
    eliminarTablaPresupuesto: function(tx){
        tx.executeSql('drop table Presupuestos',[],baseDatos.successPresupuestos, baseDatos.errorTablaSolicitudes);
    },
    eliminarTablaSolicitudesPorEnviar: function(tx){
        tx.executeSql('drop table Solicitudes_por_enviar',[],baseDatos.succesDeleteSolicitudes, baseDatos.errorTablaSolicitudes);
    },

    successLibroSolicitudesPorEnviar: function(tx, results){
        var len = results.rows.length;
        if(len >= 1){
            for (var i=0; i<len; i++){
                var r = results.rows.item(i);
                console.log(r);
          //       window.montoUtilizado =window.montoUtilizado+(r.valor_referencia*r.cantidad);
          //       window.montoUtilizado = app.formatValores(window.montoUtilizado);
          //       // largoCadena = r.valor_referencia.toString().length;
          // //       if(largoCadena > 3){
          // //           sobrante = largoCadena-3;
          // //           valorDeReferencia = r.valor_referencia.toString().substring(0,sobrante)+'.'+r.valor_referencia.toString().substring(largoCadena-3,largoCadena);
          // //       }else{
          // //           valorDeReferencia = r.valor_referencia.toString();
          // //       }
          //       valorDeReferencia = app.formatValores(r.valor_referencia);
          //       //sobrante = largoCadena-3;
          //       //valorDeReferencia = r.valor_referencia.toString().substring(0,sobrante)+'.'+r.valor_referencia.toString().substring(largoCadena-3,largoCadena);

          //       if($('#checkbox-'+r.isbn).length < 1){
          //           var $elemento = $('<li></li>');
          //           var chk = '<input type="checkbox" name="checkbox-'+r.isbn+'" id="checkbox-'+r.isbn+'" class="custom"/> <label for="checkbox-'+r.isbn+'"><p class="label-sol">'+r.nombre_libro+'</p><p class="label-precio">Precio: $'+valorDeReferencia+'</p><p class="label-cantidad">Cantidad: '+r.cantidad +'</p></label>';
          //           $elemento.html(chk);
          //           // var chk = '<input type="checkbox" name="checkbox-'+r.isbn+'" id="checkbox-'+r.isbn+'" class="custom"/> <label for="checkbox-'+r.isbn+'"><p class="label-sol"><img src="style/img/icons/solEnviadas.png" style="float:left;">'+r.nombre_libro+'<br/>Precio: $'+valorDeReferencia+'<br>Cantidad: '+r.cantidad +'<br /></p></label>';
          //           ulLista.appendChild($elemento[0]);
          //       }
            }
            // if ($('#listadoSolicitudesPorEnviar').hasClass('ui-listview')) {
            //     $('#listadoSolicitudesPorEnviar').listview('refresh');
            // } else {
            //     $('#listadoSolicitudesPorEnviar').trigger('create');
            // }
        }
        // else{
        //     //document.getElementById("sinResultadoSolicitud").innerHTML = 'Usted no tiene solicitudes por enviar.';            
        //     console.log('no tiene solicitudes por enviar');
        // }
    },

    //Resultados
    successSolicitudesPorEnviar: function(tx, results){
    	var len = results.rows.length;
        var ulLista,sobrante,largoCadena, valorDeReferencia;

        ulLista = document.getElementById('listadoSolicitudesPorEnviar'); 
        console.log("Tabla SolicitiudesPorEnviar: " + len + " filas encontradas.");
        if(len >= 1){
		    for (var i=0; i<len; i++){
		    	var r = results.rows.item(i);
		    	window.montoUtilizado =window.montoUtilizado+(r.valor_referencia*r.cantidad);
                window.montoUtilizado = app.formatValores(window.montoUtilizado);
		        // largoCadena = r.valor_referencia.toString().length;
          //       if(largoCadena > 3){
          //           sobrante = largoCadena-3;
          //           valorDeReferencia = r.valor_referencia.toString().substring(0,sobrante)+'.'+r.valor_referencia.toString().substring(largoCadena-3,largoCadena);
          //       }else{
          //           valorDeReferencia = r.valor_referencia.toString();
          //       }
                valorDeReferencia = app.formatValores(r.valor_referencia);
		        //sobrante = largoCadena-3;
		        //valorDeReferencia = r.valor_referencia.toString().substring(0,sobrante)+'.'+r.valor_referencia.toString().substring(largoCadena-3,largoCadena);

                if($('#checkbox-'+r.isbn).length < 1){
                    var $elemento = $('<li></li>');
                    var chk = '<input type="checkbox" name="checkbox-'+r.isbn+'" id="checkbox-'+r.isbn+'" class="custom"/> <label for="checkbox-'+r.isbn+'"><p class="label-sol">'+r.nombre_libro+'</p><p class="label-precio">Precio: $'+valorDeReferencia+'</p><p class="label-cantidad">Cantidad: '+r.cantidad +'</p></label>';
                    $elemento.html(chk);
                    // var chk = '<input type="checkbox" name="checkbox-'+r.isbn+'" id="checkbox-'+r.isbn+'" class="custom"/> <label for="checkbox-'+r.isbn+'"><p class="label-sol"><img src="style/img/icons/solEnviadas.png" style="float:left;">'+r.nombre_libro+'<br/>Precio: $'+valorDeReferencia+'<br>Cantidad: '+r.cantidad +'<br /></p></label>';
                    ulLista.appendChild($elemento[0]);
                }
		    }
            if ($('#listadoSolicitudesPorEnviar').hasClass('ui-listview')) {
                $('#listadoSolicitudesPorEnviar').listview('refresh');
            } else {
                $('#listadoSolicitudesPorEnviar').trigger('create');
            }
            //eliminar linea cuando se arregle el flujo
            $.mobile.changePage( '#solicitudesPorEnviarPag', { transition: "slide"} );
		}else{
			//document.getElementById("sinResultadoSolicitud").innerHTML = 'Usted no tiene solicitudes por enviar.';			
			console.log('no tiene solicitudes por enviar');
            alert('No tienes Solicitudes por enviar');
		}
    },

    succesUpdateDisponible: function(tx){
        console.log('tabla presupuesto actualizada creada');
    },

    successBorrarLibro: function(tx){
        console.log('libro borrado');
    },

    succesDeletePresupuesto: function(tx){
        console.log('tabla presupuesto eliminada');
    },
    succesDeleteSolicitudes: function(tx){
        console.log('tabla solicitudes eliminada');
    },

    succesaaa: function(tx){
        console.log('tabla solicitudes');
    },

    successPresupuestos: function(tx, results){
    	var len = results.rows.length;
        console.log("Tabla Presupuestos: " + len + " filas encontradas.");
        if(len >= 1){
		    for (var i=0; i<len; i++){
		        var r = results.rows.item(i);
                app.construirResumen(r);
		        //document.getElementById("total_presupuesto").innerHTML = r.disponible- window.montoUtilizado;		
                // document.getElementById('presupuestoValidoHasta').innerHTML = r.fechaValido
                // document.getElementById('presupuestoDisponible').innerHTML = r.disponible
                // document.getElementById('presupuestoUtilizado').innerHTML = r.utilizado;

                // document.getElementById('presupuestoValidoHastaDos').innerHTML = r.fechaValido
                // document.getElementById('presupuestoDisponibleDos').innerHTML = r.disponible
                // document.getElementById('presupuestoUtilizadoDos').innerHTML = r.utilizado;
		       
		    }
		}else{
			console.log('no tiene presupuestos asociados');
		}
    },

    successTablaSolicitudes: function(){
    	console.log('tabla solicitudes creada');
    },
    successGuardarLibro: function(){
    	console.log('Libro Creado Exitosamente');
        //app.construirResumen(idEvento);
        alert('Libro guardado exitosamente.');
        $.mobile.changePage( '#inicio',{transition: "slide"});
    },

    successBuscarLibroEnvio: function(tx, results){
        //var len = results.rows.length;
        var len = results.rows.length;
        window.encontrados = new Array(len);
        for (var i=0; i<len; i++){
            console.log(results.rows.item(i));
            window.encontrados[i] = results.rows.item(i);
        }
        console.log("Tabla Solicitudes por enviar: Libros encontrados.");
        console.log('Libro Encontrado Exitosamente');
    },

    //Errores de transaccion
    errorTablaSolicitudes: function(tx){
    	console.log("Error creando tabla solicitudes Codigo: "+tx.code);
        console.log("Error creando tabla solicitudess SQL: "+tx.message);
    },

    errorGuardarLibro: function(tx) {
        console.log("Error guardando libro SQL Codigo: "+tx.code);
        console.log("Error guardando libro SQL: "+tx.message);
    },
    errorTransaccion: function(tx){
        console.log("Error creando tabla solicitudes Codigo: "+tx.code);
        console.log("Error creando tabla solicitudess SQL: "+tx.message);
    },
    errorBuscarLibroEnvio: function(tx){
        console.log("Error buscando Libros para envio Solicitud Codigo: "+tx.code);
        console.log("Error buscando Libros para envio Solicitud SQL: "+tx.message);
    },
    // Función 'callback' de error de transacción
    errorCB: function(tx) {
        alert("Error procesando SQL: "+tx.message);
        console.log("Error procesando SQL Codigo: "+tx.code);
        console.log("Error procesando SQL: "+tx.message);
    },
    errorObteniendoPresupuesto: function(tx) {
        alert("Error procesando SQL: "+tx.message);
        console.log("Error procesando SQL Codigo: "+tx.code);
        console.log("Error procesando SQL: "+tx.message);
    },

    errorBorrarLibro: function(tx) {
        alert("Error procesando SQL: "+tx.message);
        console.log("Error procesando SQL Codigo: "+tx.code);
        console.log("Error procesando SQL: "+tx.message);
    }

}