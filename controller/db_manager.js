var baseDatos = {

	//Conectarse a la base de datos o crear una nueva
    abrirBD: function(){
        var db = openDatabase('dibam', '1.0', 'Dibam', 100 * 1024);
        return db;
    },
	//Creacion de Tablas
    tablaSolicitudesPorEnviar:function(tx){
        tx.executeSql('create table if not exists Solicitudes_por_enviar (isbn, nombre_libro, valor_referencia, cantidad, imagen )');
        console.log('tabla Solicitudes_por_enviar creada');
    },
    tablaPresupuestos:function(tx){
        //tx.executeSql('create table if not exists Presupuestos (id unique, nombre, total, disponible, utilizado,fechaValido)');
        tx.executeSql('create table if not exists Presupuestos (id unique, nombrePresupuesto, totalPresupuesto, disponiblePresupuesto, utilizado,fechaValidoHasta)');
        console.log('tabla presupuesto creada');
    },

    //inserts
	agregarSolicitud: function(tx, libro){
		var valor_referencia = libro.valor_referencia.replace('.','').replace(',','');
        window.montoUtilizado = window.montoUtilizado + (valor_referencia*1);
        // var idPresupuesto = 1;
        var idPresupuesto = window.usuario.evento.id;
        console.log('Valor: '+(valor_referencia*1)*libro.cantidad);
        var utilizado = (valor_referencia*1)*libro.cantidad;
        tx.executeSql('insert into Solicitudes_por_enviar (isbn, nombre_libro, valor_referencia, cantidad, imagen) values ('+libro.isbn+', "'+libro.nombre_libro+'", '+valor_referencia+', '+libro.cantidad+', "'+libro.imagen+'")');
        tx.executeSql('update Presupuestos set utilizado = (select utilizado from Presupuestos where id='+idPresupuesto+')+'+utilizado+', disponiblePresupuesto = (select disponiblePresupuesto from Presupuestos where id='+idPresupuesto+')-'+utilizado+' WHERE id = '+idPresupuesto);
        baseDatos.obtenerPresupuestoId(tx, idPresupuesto);
    },

    agregarPresupuesto: function(tx, presupuesto){
    	console.log(presupuesto);
        // var fecha = new Date(presupuesto.fechaValidoHasta).toLocaleDateString();
        //var fecha = new Date(presupuesto.fechaValidoHasta).toString();
        tx.executeSql('insert into Presupuestos (id, nombrePresupuesto, totalPresupuesto, disponiblePresupuesto, utilizado,fechaValidoHasta) VALUES ('+presupuesto.id+',"'+presupuesto.nombrePresupuesto+'",'+presupuesto.totalPresupuesto+','+presupuesto.disponiblePresupuesto+','+presupuesto.utilizado+',"'+presupuesto.fechaValidoHasta+'")');
        // document.getElementById('presupuestoValidoHasta').innerHTML = fecha;
        // document.getElementById('presupuestoDisponible').innerHTML = presupuesto.disponiblePresupuesto;
        // document.getElementById('presupuestoUtilizado').innerHTML = presupuesto.utilizado;
    },

    //Updates
    updatePresupuesto: function(tx, valor, idPresupuesto){
        tx.executeSql('update Presupuestos set utilizado ='+valor+' WHERE id = '+idPresupuesto+';', [], baseDatos.succesUpdateDisponible, baseDatos.errorTransaccion);
    },

    //Consultas
    verificarLibro: function(tx, libro){
    	tx.executeSql('select * from Solicitudes_por_enviar where isbn='+libro.isbn, [], function(tx, results){
    		if(results.rows.length == 0){
    			console.log('agregado');   			
    			baseDatos.agregarSolicitud(tx, libro);
                //app.construirResumen(r);

    		}else{
    			alert('el libro ya se encuentra agregado');
    		}
    	}, baseDatos.errorGuardar);
    },

    verificarPresupuesto: function(tx, presupuesto){
    	tx.executeSql('select * from Presupuestos where id='+presupuesto.id, [], function(tx, results){
    		if(results.rows.length == 0){
    			console.log('agregado');   			
    			baseDatos.agregarPresupuesto(tx, presupuesto);
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

    obtenerPresupuesto: function(tx){
    	tx.executeSql('select * from Presupuestos', [], baseDatos.successPresupuestos, app.errorCB);
    },

    obtenerPresupuestoId: function(tx, idEvento){
        tx.executeSql('select * from Presupuestos where id='+idEvento, [], baseDatos.successPresupuestos, app.errorCB);
    },

    obtenerSolicitudesPorEnviar: function(tx) {
        tx.executeSql('select * from Solicitudes_por_enviar', [], baseDatos.successSolicitudesPorEnviar, app.errorCB);
    },

	borrarLibro: function(tx, isbn) {
        tx.executeSql('delete from Solicitudes_por_enviar where isbn='+isbn, [], baseDatos.successBorrarLibro, app.errorCB);
    },
    eliminarTablaPresupuesto: function(tx){
        tx.executeSql('drop table Presupuestos',[],baseDatos.successPresupuestos, baseDatos.errorTablaSolicitudes);
    },
    eliminarTablaSolicitudesPorEnviar: function(tx){
        tx.executeSql('drop table Solicitudes_por_enviar',[],baseDatos.succesDeleteSolicitudes, baseDatos.errorTablaSolicitudes);
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
		}else{
			document.getElementById("sinResultadoSolicitud").innerHTML = 'Usted no tiene solicitudes por enviar.';			
			console.log('no tiene solicitudes por enviar');
		}
    },

    succesUpdateDisponible: function(tx){
        console.log('tabla presupuesto actualizada creada');
    },

    succesDeletePresupuesto: function(tx){
        console.log('tabla presupuesto eliminada');
    },
    succesDeleteSolicitudes: function(tx){
        console.log('tabla solicitudes eliminada');
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
        $.mobile.changePage( '#inicio',{transition: "slide"});
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
    }


}