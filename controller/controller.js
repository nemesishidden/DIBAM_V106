/*
 *
 */
var pictureSource;
var destinationType; 
var montoUtilizado = 0;
var db;
var usuario;
var encontrados;
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
        document.getElementById('enviarSolicitud').addEventListener('click', this.enviarSolicitud, false);
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
                document.getElementById("precioReferencia").innerHTML = 0;
                $('#formLibroNuevo')[0].reset();
                if(result.text.toString().trim().length >=1){
                    app.buscarLibro(result.text);
                }else{
                    $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
                }                
            }, 
            function (error) {
                alert("Error al escanear el Libro: " + error);
            }
        );
        // document.getElementById("precioReferencia").innerHTML = 0;
        // $('#formLibroNuevo')[0].reset();
        // app.buscarLibro(9789568410575);
    },

    logear: function(){
        console.log('logear');
        //$('.divResumen').find('p').remove();

        var form = $("#formLogin").serializeArray();
        $.ajax({
            url: 'http://dibam-sel.opensoft.cl/OpenSEL/json/jsonLogin.asp',
            type: 'POST',
            dataType: 'json',
            data: {
                argUsuario: form[0].value.toLowerCase(),
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
                            // baseDatos.eliminarTablaSolicitudesPorEnviar(tx);
                            baseDatos.tablaSolicitudesPorEnviar(tx);
                            baseDatos.tablaPresupuestos(tx);
                            baseDatos.verificarPresupuesto(tx, presupuestos, window.usuario.id);
                            baseDatos.obtenerPresupuestoId(tx, window.usuario);
                        }, baseDatos.errorTablaSolicitudes, baseDatos.successTablaSolicitudes );

                        //app.construirResumen(presupuestos);
                        // $('p').remove('.resumen');
                        // var $children = $('<p class="resumen"></p>');
                        // $children.html('Evento Valido Hasta: '+presupuestos.fechaValidoHasta.toString()+' <br />Disponible: '+app.formatValores(presupuestos.disponiblePresupuesto)+' / Utilizado: '+app.formatValores(presupuestos.utilizado)+' ');
                        // $('.divResumen').append($children);

                }else{
                    alert('Usted no se encuentra registrado.');
                }
            }
        });
    },

    formatValores: function(valor){
        var valorFormateado = '';
        var numero = valor.toString().replace(/\./g,'');
        while(numero.length > 3){
            valorFormateado = '.' + numero.substring(numero.length - 3) + valorFormateado;
            numero = numero.substring(0, numero.length - 3);
        }
        valorFormateado = numero + valorFormateado;
        return valorFormateado;
    },

    construirResumen: function(p){
        $('p').remove('.resumen');
        var $children = $('<p class="resumen"></p>');
        $children.html('<b>'+p.nombrePresupuesto+'</b><br />Evento Valido Hasta: '+p.fechaValidoHasta.toString()+' <br />Disponible: '+app.formatValores(p.disponiblePresupuesto)+' / Utilizado: '+app.formatValores(p.utilizado)+' ');
        //elements[i].innerHTML = $children;
        $('.divResumen').append($children);
    },

    // nuevaSolicitud: function(){
    //     $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
    // },

    obtenerSolicitudes: function(){
        var pag = '#'+this.id+'Pag';
        var idEvento = window.usuario.evento.id;
        window.db.transaction(function(tx) {
            baseDatos.obtenerSolicitudesPorEnviar(tx, window.usuario);
            baseDatos.obtenerPresupuestoId(tx, window.usuario);
        }, baseDatos.errorTablaSolicitudes, function(tx){
            //$.mobile.changePage( pag, { transition: "slide"} );
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
                    alert(data.model.error);
                }
            }
        });
        //listSolEnviadas
        //$.mobile.changePage( pag, { transition: "slide"} );
    },

    actualizaTotal: function(cantidad){
        //var valor = $('#precioReferencia').val();
        var valor = document.getElementById("precioReferencia").value;
        var total = parseInt(valor)*parseInt(cantidad.value);
        total = app.formatValores(total);
        $('#totalPresupuesto').text(total);
    },

    irEvento: function(eId){
        console.log(eId);
        window.eventos.forEach(function(e){
            if(eId == e.EventoId){
                document.getElementById('evNomEvento').innerHTML = e.Nombre;
                document.getElementById('evMontoTotal').innerHTML = app.formatValores(e.totalPresupuesto);
                document.getElementById('evFecha').innerHTML = e.FechaEnvioSolicitud.toString();
                document.getElementById('evUtilizado').innerHTML = app.formatValores(e.PresupuestoUtilizado); 
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
    librosEncontrados: function(encontrados){
        console.log(encontrados);
    },

    buscarLibro: function(codigoIsbn){
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
        // $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
    },

    guardarLibro: function(){
        console.log('guardarLibro idEvento: '+window.usuario.evento.id);
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
                autor: document.getElementById("autor").value
            };
            window.db.transaction(function(tx) {
                baseDatos.verificarLibro(tx,libro, window.usuario);
            }, baseDatos.errorGuardarLibro, baseDatos.successGuardarLibro);
        }
        
        // var pag = '#inicio';
        // $.mobile.changePage( pag, { transition: "slide"} );
    },

    enviarSolicitud: function(){
        var largoArray = $('#listadoSolicitudesPorEnviar').find('li').find('input:checked').length;
        var libros = new Array(largoArray);
        var i = 0;
        $('#listadoSolicitudesPorEnviar').find('li').find('input:checked').each(function(e, b){
            var libro = {
                codigoISBN: b.id.split('-')[1],
                Titulo: '',
                Autor: '',
                Cantidad: '',
                Precio: ''
            };
            libros[i] = libro;
            i++;
        });
        console.log('enviarSolicitud ');
        console.log(libros);
        window.db.transaction(function(tx){
           baseDatos.obtenerLibroSolicitudesPorEnviar(tx, libros, window.usuario);
        }, baseDatos.errorBuscarLibroEnvio, function(){
            window.encontrados.forEach(function(x){
                libros.forEach(function(z){
                    if(parseInt(z.codigoISBN) == x.isbn){
                        console.log(z);
                        z.Autor = x.autor;
                        z.Titulo = x.nombre_libro;
                        z.Cantidad = x.cantidad;
                        z.Precio = x.valor_referencia;
                    }
                });
            });
            app.enviarDibam(libros);
        });
    },

    enviarDibam: function(sol){
        var solicitud = {
            model: {
                eventoId: window.usuario.evento.id,
                usuarioId: window.usuario.id,
                libros: sol
            }
        };
        // $.ajax({
        //     url: 'http://dibam-sel.opensoft.cl/OpenSEL/json/jsonRecibeSolicitud.asp',
        //     type: 'POST',
        //     dataType: 'json',
        //     data: {
        //        argSolicitudJSON: solicitud
        //     },
        //     error : function (){ document.title='error'; }, 
        //     success: function (data) {                
        //         if(data.success){
        //             $.mobile.changePage( '#inicio', {transition: "slide"});
        //         }else{
        //             alert(data.model.error+'.');
        //             $.mobile.changePage( '#inicio', {transition: "slide"});
        //         }
        //     }                
            
        // });
        window.db.transaction(function(tx) {
            baseDatos.borrarLibro(tx, window.usuario);
        }, baseDatos.errorTablaSolicitudes, function(tx){
            alert('Su solicitud ha sido enviada con exito.');
            $.mobile.changePage( '#inicio', {transition: "slide"});
        } );
        

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
