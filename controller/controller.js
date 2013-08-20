/*
 *
 */
var pictureSource;
var destinationType; 
var montoUtilizado = 0;
var db;
var usuario;
var eventos;
var app = {

    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.getElementById('logear').addEventListener('click', this.logear, false);        
        document.getElementById('scan').addEventListener('click', this.scan, false);
        document.getElementById('guardarLibro').addEventListener('click', this.guardarLibro, false);
        document.getElementById('solicitudesPorEnviar').addEventListener('click', this.obtenerSolicitudes, false);
        document.getElementById('solicitudesEnviadas').addEventListener('click', this.obtenerSolicitudesEnviadas, false);       
    },

    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },

    receivedEvent: function(id) {
        // var parentElement = document.getElementById(id);
        // var listeningElement = parentElement.querySelector('.listening');
        // var receivedElement = parentElement.querySelector('.received');

        // listeningElement.setAttribute('style', 'display:none;');
        // receivedElement.setAttribute('style', 'display:block;');

        console.log('Evento Recivido: ' + id);
    },

    scan: function() {
        var scanner = cordova.require("cordova/plugin/BarcodeScanner");
        scanner.scan(
            function (result) {
                $('#formLibroNuevo')[0].reset()
                app.buscarLibro(result.text);
            }, 
            function (error) {
                alert("Error al escanear el Libro: " + error);
            }
        );
        // $('#formLibroNuevo')[0].reset()
        // app.buscarLibro(9788497321891);
    },

    logear: function(){
        console.log('logear');
        var form = $("#formLogin").serializeArray();
        $.ajax({
            url: 'http://dibam-sel.opensoft.cl/OpenSEL/json/jsonLogin.asp',
            type: 'POST',
            dataType: 'json',
            data: {
                argUsuario: form[0].value,
                argClave: form[1].value
            },
            error : function (){
                document.title='error';
            }, 
            success: function (data) {
                if(data.success){
                    window.usuario = data.model;
                    var presupuestos = data.model.evento;
                    var pag = '#inicio';
                    $.mobile.changePage( pag, { transition: "slide"});
                    window.db = baseDatos.abrirBD();
                    window.db.transaction(
                        function(tx) {
                            // baseDatos.eliminarTablaPresupuesto(tx);
                            baseDatos.tablaSolicitudesPorEnviar(tx);
                            baseDatos.tablaPresupuestos(tx);
                            baseDatos.verificarPresupuesto(tx, presupuestos);
                            baseDatos.obtenerPresupuesto(tx);
                        }, baseDatos.errorTablaSolicitudes, baseDatos.successTablaSolicitudes );
                    //var elements = document.getElementsByClassName("divResumen");
                    //var elements = $('.divResumen');
                    var $children = $('<p class="resumen"></p>');
                    $children.html('Evento Valido Hasta: '+presupuestos.fechaValidoHasta.toString()+' <br />Disponible: '+presupuestos.disponiblePresupuesto+' / Utilizado: '+presupuestos.utilizado+' ');
                    //elements[i].innerHTML = $children;
                    $('.divResumen').append($children);
                    // for (var i = 0; i < elements.length; i++) {
                    //     //usuario.evento.disponiblePresupuesto
                    //     var $children = $('<p class="resumen"></p>');
                    //         $children.html('Evento Valido Hasta:'+presupuestos.fechaValidoHasta.toString()+' <br />Disponible: '+presupuestos.disponiblePresupuesto+' / Utilizado:'+presupuestos.utilizado+' ');
                    //     elements[i].innerHTML = $children;
                    //     $('.divResumen').append($children);
                    // }

                }else{
                    alert('Usted no se encuentra registrado.');
                }
            }
        });
    },

    // nuevaSolicitud: function(){
    //     $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
    // },

    obtenerSolicitudes: function(){
        var pag = '#'+this.id+'Pag';
        window.db.transaction(function(tx) {
            baseDatos.obtenerSolicitudesPorEnviar(tx);
            baseDatos.obtenerPresupuesto(tx);
        }, baseDatos.errorTablaSolicitudes, function(tx){
            $.mobile.changePage( pag, { transition: "slide"} );
        } );
    },

    obtenerSolicitudesEnviadas: function(){
        var pag = '#'+this.id+'Pag';

        $.ajax({
            url: 'http://dibam-sel.opensoft.cl/OpenSEL/json/jsonSolicitudesEnviadas.asp',
            type: 'POST',
            dataType: 'json',
            data: {
                argUsuarioId: window.usuario.id
            },
            error : function (){
                document.title='error';
            }, 
            success: function (data) {
                if(data.success){
                    window.eventos = data.model;
                    data.model.forEach(function(e){
                        if($('#evento-'+e.EventoId).length < 1){
                            var $elemento = $('<li></li>'); 
                            $elemento.html('<a href="" onClick="app.irEvento('+e.EventoId+') "id="evento-'+e.EventoId+'">'+e.Nombre+'</a>');
                            // var chk = '<input type="checkbox" name="checkbox-'+r.isbn+'" id="checkbox-'+r.isbn+'" class="custom"/> <label for="checkbox-'+r.isbn+'"><p class="label-sol"><img src="style/img/icons/solEnviadas.png" style="float:left;">'+r.nombre_libro+'<br/>Precio: $'+valorDeReferencia+'<br>Cantidad: '+r.cantidad +'<br /></p></label>';
                            $('#listSolEnviadas').append($elemento);
                        }
                    });
                    
                    //$('#listSolEnviadas').listview('refresh');
                    $.mobile.changePage( pag, { transition: "slide"} );    
                }else{
                    alert('error');
                }
            }
        });
        //listSolEnviadas
        //$.mobile.changePage( pag, { transition: "slide"} );
    },

    irEvento: function(eId){
        console.log(eId);
        window.eventos.forEach(function(e){
            if(eId == e.EventoId){
                document.getElementById('evNomEvento').innerHTML = e.Nombre;
                document.getElementById('evMontoTotal').innerHTML = e.totalPresupuesto;
                document.getElementById('evFecha').innerHTML = e.FechaEnvioSolicitud.toString();
                document.getElementById('evUtilizado').innerHTML = e.PresupuestoUtilizado; 
            }
            console.log(e);
        });
        $.mobile.changePage( '#detalleSolicitud', { transition: "slide"} ); 
    },
    // cambioPagina: function(){
    //     //app.buscarLibro(9789583001030);
    //     // var pag = '#'+this.id+'Pag';
    //     // $.mobile.changePage( pag, { transition: "slide"} );
    // },


    // obtenerPresupuestos: function(presupuestos){
    //     // presupuestos.forEach(function(a){
    //     //     console.log(a);
    //     //     var str = '<li><a href="" id=""><img src="style/img/icons/solEnviadas.png"><p class="ui-li-desc-menu">'+a.nombrePresupuesto+'<br/>'+a.totalPresupuesto+'</p></a></li>'
    //     //     $('#listadoSolicitudesPorEnviar').append(str);
    //     // });
    // },

    buscarLibro: function(codigoIsbn){
        if(codigoIsbn.toString().length >= 1)){
            $.ajax({
                //url: 'data/libro.json',
                //url: 'http://dibam-sel.opensoft.cl/libro.asp',
                url: 'http://dibam-sel.opensoft.cl/OpenSEL/json/jsonLibro.asp',
                type: 'POST',
                dataType: 'json',
                data: {
                   argISBN: codigoIsbn
                },
                error : function (){ document.title='error'; }, 
                success: function (data) {
                    if(isbn.toString().length != 0){
                        if(data.success){
                            var a = data.model;
                            document.getElementById("isbn").value = a.isbn;
                            document.getElementById("titulo").value = a.titulo;
                            document.getElementById("autor").value = a.autor;
                        }else{
                            alert(data.model.error+'\nPor favor ingreselo manualmente.');
                            document.getElementById("isbn").value = codigoIsbn;
                        }
                        $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
                    }                
                }
            });
        }
        
        // $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
    },

    guardarLibro: function(){
        console.log('guardarLibro');
        var guardar = false;
        if(document.getElementById("isbn").value.trim().length <= 0){
            alert('Debe completar el campo ISBN.');
        }else if(document.getElementById("titulo").value.trim().length <= 0){
            alert('Debe completar el campo Titulo.');
        }else if(document.getElementById("autor").value.trim().length <= 0){
            alert('Debe completar el campo Autor.');
        }else if(parseInt(document.getElementById("precioReferencia").value) <= 0){
            alert('Debe completar el campo Valor.');
        }else if(parseInt(document.getElementById("cantidad").value) <= 0){
            alert('Debe completar el campo Cantidad.');
        }else{
            guardar = true;
        }
        if(guardar){
            var libro = {
                isbn: document.getElementById("isbn").value,
                nombre_libro: document.getElementById("titulo").value,
                valor_referencia: document.getElementById("precioReferencia").value,
                cantidad: document.getElementById("cantidad").value,
                imagen: 'sin imagen'
            };
            window.db.transaction(function(tx) {
                baseDatos.verificarLibro(tx,libro);
            }, baseDatos.errorGuardarLibro, baseDatos.successGuardarLibro);
        }
        
        // var pag = '#inicio';
        // $.mobile.changePage( pag, { transition: "slide"} );
    }

    // queryDB: function(tx) {
    //     tx.executeSql('SELECT * FROM Presupuestos', [], app.querySuccessPresupuestos, app.errorCB);
    // },

    // querySolicitudesPorEnviar: function(tx) {
    //     tx.executeSql('SELECT * FROM Solicitudes_por_enviar', [], app.querySuccessSolicitiudesPorEnviar, app.errorCB);
    // },

    // verificarPresupuestos: function(tx, presupuesto) {
    //     tx.executeSql('SELECT * FROM Presupuestos where id='+presupuesto.id, [], function(tx, results){
    //         var len = results.rows.length;
    //         if(len == 0){
    //             console.log('no existe');
    //             tx.executeSql('insert into Presupuestos (id, nombre, total, disponible, utilizado) VALUES ('+presupuesto.id+',"'+presupuesto.nombrePresupuesto+'",'+presupuesto.totalPresupuesto+','+presupuesto.disponiblePresupuesto+','+presupuesto.utilizado+')');
    //         }else{
    //             console.log('existe');
    //             app.querySuccessPresupuestos(tx, results);
    //         }
    //     }, app.errorCB);
    // },
    // querySuccess: function(tx, results) {
    //     // debería estar vacio ya que se inserto nada
    //     console.log("ID insert = " + results.insertId);
    //     // Sera 0 debido que es una sentencia SQL de tipo 'select'
    //     console.log("Filas afectadas = " + results.rowAffected);
    //     // El numero de filas retornadas
    //     console.log("Filas retornadas = " + results.rows.length);
    //     alert("ID insert = " + results.insertId+"Filas afectadas = " + results.rowAffected+"Filas retornadas = " + results.rows.length);
    //     return true;
    // },

    // querySuccessPresupuestos: function(tx, results) {
    //     var len = results.rows.length;
    //     console.log("Tabla Presupuestos: " + len + " filas encontradas.");
    //     for (var i=0; i<len; i++){
    //         var r = results.rows.item(i);
    //         console.log("Fila = " + i + " ID = " + r.id + " Presupuesto =  " + r.nombre + " totalPresupuesto =  " + r.total + " disponiblePresupuesto =  " + r.disponible+ " utilizado =  " + r.utilizado);
    //     }
    // },

    // querySuccessSolicitiudesPorEnviar: function(tx, results) {
    //     var len = results.rows.length;
    //     console.log("Tabla SolicitiudesPorEnviarkkkkk: " + len + " filas encontradas.");
    //     for (var i=0; i<len; i++){
    //         var r = results.rows.item(i);
    //         console.log(r);
    //         //console.log("Fila = " + i + " ID = " + r.id + " Presupuesto =  " + r.nombre + " totalPresupuesto =  " + r.total + " disponiblePresupuesto =  " + r.disponible+ " utilizado =  " + r.utilizado);
    //     }
    // },

    // // Función 'callback' de error de transacción
    // errorCB: function(tx) {
    //     alert("Error procesando SQL: "+tx.message);
    //     console.log("Error procesando SQL Codigo: "+tx.code);
    //     console.log("Error procesando SQL: "+tx.message);
    // },

    // // Función 'callback' de transacción satisfactoria
    // successCB:  function() {
    //     alert("bien!");
    // }

};
