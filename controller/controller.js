/*
 *
 */
var pictureSource;
var destinationType; 
var montoUtilizado = 0;
var db;
var app = {

    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.getElementById('logear').addEventListener('click', this.logear, false);
        
        document.getElementById('scan').addEventListener('click', this.scan, false);
        document.getElementById('guardarLibro').addEventListener('click', this.guardarLibro, false);
        //document.getElementById('newSolicitud').addEventListener('click', this.cambioPagina, false);
        //document.getElementById('newSolicitud').addEventListener('click', this.nuevaSolicitud, false);
        document.getElementById('solicituesPorEnviar').addEventListener('click', this.obtenerSolicitudes, false);
        
    },

    onDeviceReady: function() {
        //window.pictureSource=navigator.camera.PictureSourceType;
        //window.destinationType=navigator.camera.DestinationType;
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
        // console.log('scanning');
        // try {
        //     window.plugins.barcodeScanner.scan(function(args) {
        //         console.log("Scanner result: \n" +
        //             "text: " + args.text + "\n" +
        //             "format: " + args.format + "\n" +
        //             "cancelled: " + args.cancelled + "\n");
        //         app.buscarLibro(args.text);
        //         $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
        //         console.log(args);
        //     });
        // } catch (ex) {
        //     console.log(ex.message);
        // }
        //app.buscarLibro(789568410578);
        var scanner = cordova.require("cordova/plugin/BarcodeScanner");

        scanner.scan(
            function (result) {
                //if(result.format == 'EAN_13'){
                    app.buscarLibro(result.text);
                // }else{
                //     alert("El codigo escaneado no es un libro, por favor intene nuevamente.")
                // }
                
                // if(!app.buscarLibro(result.text)){
                //     alert('El libro no se encuentra en nuestros registros, por favor agregar manualmente.');
                // }
                
                // $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
            }, 
            function (error) {
                alert("Error al escanear el Libro: " + error);
            }
        );
    },

    logear: function(){
        console.log('logear');
        var form = $("#formLogin").serializeArray();
        $.ajax({
            //url: 'data/usuario.json',
            //url: 'http://dibam-sel.opensoft.cl/usuario.asp',
            url: 'http://dibam-sel.opensoft.cl/OpenSEL/json/jsonLogin.asp',
            type: 'POST',
            //dataType: 'json',
            //data: JSON.stringify($("#formLogin").serializeArray()),
            data: {
                argUsuario: form[0].value,
                argClave: form[1].value
            },
            error : function (){ document.title='error'; }, 
            success: function (data) {
                var dat = JSON.parse(data.split('-->')[1]);
                if(dat.success == 'OK'){
                    //if(document.getElementById('username').value == data.model.usuario && document.getElementById('pass').value == data.model.pass){
                        var presupuestos = dat.model.evento;
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
                    // }else{
                    //     alert('Usted no se encuentra registrado.');
                    // }       
                }
            }
        });
    },

    nuevaSolicitud: function(){
        $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
    },

    obtenerSolicitudes: function(){
        var pag = '#'+this.id+'Pag';
        window.db.transaction(function(tx) {
            baseDatos.obtenerSolicitudesPorEnviar(tx);
            baseDatos.obtenerPresupuesto(tx);
        }, baseDatos.errorTablaSolicitudes, function(tx){
            $.mobile.changePage( pag, { transition: "slide"} );
        } );
    },

    cambioPagina: function(){
        //app.buscarLibro(9789583001030);
        // var pag = '#'+this.id+'Pag';
        // $.mobile.changePage( pag, { transition: "slide"} );
    },


    obtenerPresupuestos: function(presupuestos){
        // presupuestos.forEach(function(a){
        //     console.log(a);
        //     var str = '<li><a href="" id=""><img src="style/img/icons/solEnviadas.png"><p class="ui-li-desc-menu">'+a.nombrePresupuesto+'<br/>'+a.totalPresupuesto+'</p></a></li>'
        //     $('#listadoSolicitudesPorEnviar').append(str);
        // });
    },

    buscarLibro: function(codigoIsbn){
        var existe = false;
        $.ajax({
            //url: 'data/libro.json',
            url: 'http://dibam-sel.opensoft.cl/libro.asp',
            type: 'POST',
            dataType: 'json',
            error : function (){ document.title='error'; }, 
            success: function (data) {
                if(data.success){
                    data.model.forEach(function(a){
                        if(a.isbn == codigoIsbn){
                            existe = true;
                            document.getElementById("isbn").value = a.isbn;
                            document.getElementById("titulo").value = a.titulo;
                            document.getElementById("autor").value = a.autor;
                            document.getElementById("precioReferencia").value = a.precioReferencia;
                        }
                    });
                }
            }
        });
        if(!existe){
            document.getElementById("isbn").value=codigoIsbn;
            alert("El libro no se encuentra en nuestros registros, por favor ingreselo manuelmente.");
        }
        $.mobile.changePage( '#newSolicitudPag', { transition: "slide"} );
    },

    guardarLibro: function(){
        console.log('guardarLibro');
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
        // var pag = '#inicio';
        // $.mobile.changePage( pag, { transition: "slide"} );
    },

    queryDB: function(tx) {
        tx.executeSql('SELECT * FROM Presupuestos', [], app.querySuccessPresupuestos, app.errorCB);
    },

    querySolicitudesPorEnviar: function(tx) {
        tx.executeSql('SELECT * FROM Solicitudes_por_enviar', [], app.querySuccessSolicitiudesPorEnviar, app.errorCB);
    },

    verificarPresupuestos: function(tx, presupuesto) {
        tx.executeSql('SELECT * FROM Presupuestos where id='+presupuesto.id, [], function(tx, results){
            var len = results.rows.length;
            if(len == 0){
                console.log('no existe');
                tx.executeSql('insert into Presupuestos (id, nombre, total, disponible, utilizado) VALUES ('+presupuesto.id+',"'+presupuesto.nombrePresupuesto+'",'+presupuesto.totalPresupuesto+','+presupuesto.disponiblePresupuesto+','+presupuesto.utilizado+')');
            }else{
                console.log('existe');
                app.querySuccessPresupuestos(tx, results);
            }
        }, app.errorCB);
    },
    querySuccess: function(tx, results) {
        // debería estar vacio ya que se inserto nada
        console.log("ID insert = " + results.insertId);
        // Sera 0 debido que es una sentencia SQL de tipo 'select'
        console.log("Filas afectadas = " + results.rowAffected);
        // El numero de filas retornadas
        console.log("Filas retornadas = " + results.rows.length);
        alert("ID insert = " + results.insertId+"Filas afectadas = " + results.rowAffected+"Filas retornadas = " + results.rows.length);
        return true;
    },

    querySuccessPresupuestos: function(tx, results) {
        var len = results.rows.length;
        console.log("Tabla Presupuestos: " + len + " filas encontradas.");
        for (var i=0; i<len; i++){
            var r = results.rows.item(i);
            console.log("Fila = " + i + " ID = " + r.id + " Presupuesto =  " + r.nombre + " totalPresupuesto =  " + r.total + " disponiblePresupuesto =  " + r.disponible+ " utilizado =  " + r.utilizado);
        }
    },

    querySuccessSolicitiudesPorEnviar: function(tx, results) {
        var len = results.rows.length;
        console.log("Tabla SolicitiudesPorEnviarkkkkk: " + len + " filas encontradas.");
        for (var i=0; i<len; i++){
            var r = results.rows.item(i);
            console.log(r);
            //console.log("Fila = " + i + " ID = " + r.id + " Presupuesto =  " + r.nombre + " totalPresupuesto =  " + r.total + " disponiblePresupuesto =  " + r.disponible+ " utilizado =  " + r.utilizado);
        }
    },

    // Función 'callback' de error de transacción
    errorCB: function(tx) {
        alert("Error procesando SQL: "+tx.message);
        console.log("Error procesando SQL Codigo: "+tx.code);
        console.log("Error procesando SQL: "+tx.message);
    },

    // Función 'callback' de transacción satisfactoria
    successCB:  function() {
        alert("bien!");
    }

};
