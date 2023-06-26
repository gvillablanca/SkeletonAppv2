import { Injectable } from '@angular/core';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform, ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from './usuario';
import { Nota } from './nota';

@Injectable({
  providedIn: 'root'
})
export class BdserviceService {

  public database!: SQLiteObject;
  //create tables
  tablaUsuario: string = "CREATE TABLE IF NOT EXISTS USUARIO( "+
                            "ID_USER    INTEGER PRIMARY KEY AUTOINCREMENT,"+
                            "NOMBRE		  VARCHAR(40) NOT NULL, "+
                            "APELLIDO	  VARCHAR(40) NOT NULL, "+
                            "MAIL		    VARCHAR(100) NOT NULL, "+
                            "NIVEL_EDUC	VARCHAR(100) NOT NULL,"+
                            "CLAVE      VARCHAR(15) NOT NULL,"+
                            "USER       VARCHAR(15) NOT NULL);"

  tablaNotas: string = "CREATE TABLE IF NOT EXISTS NOTA( "+
                        "  ID_NOTA INTEGER PRIMARY KEY AUTOINCREMENT, "+
                        "  ID_USER INTEGER NOT NULL, "+
                        "  DETALLE VARCHAR(255) NOT NULL, "+
                        "  FOREIGN KEY (ID_USER) REFERENCES USUARIO(ID_USER));"

  //insert 
  registrarUsuario: string = "INSERT OR IGNORE INTO USUARIO(ID_USER, NOMBRE, APELLIDO, MAIL, NIVEL_EDUC, FECHA_NAC, CLAVE) VALUES(0,'Genoveva','villablanca', 'ge.villablanca@duocuc.cl', 'universitaria', '12345');"  
  registrarNota: string = "INSERT OR IGNORE INTO NOTA(ID_NOTA, ID_USER, DETALLE) VALUES(0,0,'ESTO ES UNA NOTA DE PRUEBA');"

  //observables
  listaUsuarios = new BehaviorSubject([]);
  listaNotas = new BehaviorSubject([]);

  private isDBReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  
  constructor(private toastController: ToastController, private sqlite: SQLite, private platform:Platform) {}

  async presentToast(msj:string) {
    const toast = await this.toastController.create({
      message: msj,
      duration: 1500,
      position: 'bottom',
      icon: 'globe',
    });

    await toast.present();
  }

  //retornar estado de la base de datos
  dbState(){
    return this.isDBReady.asObservable();
  }

  //retornar registros de las tablas en la base de datos
  fetchUsuario(): Observable<Usuario[]>{
    return this.listaUsuarios.asObservable();
  }

  fetchNota(): Observable<Nota[]>{
    return this.listaNotas.asObservable();
  }

  crearDB(){
    this.platform.ready().then(()=>{
      //crear db
      this.sqlite.create({
        name: 'skeletonapp.db',
        location: 'default'
      }).then((db: SQLiteObject)=>{
        //guardar conexion en variable
        this.database = db;
        //llamar fn crear tablas y registros

      }).catch(e=>{
        this.presentToast("Error en creacion de db: " + e);
      })
    })
  }

  async crearTablaUsuario(){
      try{
        await this.database.executeSql(this.tablaUsuario, []);
        //insert de datos
        await this.database.executeSql(this.registrarUsuario, []);
        //cargar datos en observable

      }
      catch(e){
        this.presentToast("Error en tabla de db: " + e);
      }
  }

  async crearTablaNota(){
    try{
      await this.database.executeSql(this.tablaNotas, []);
      await this.database.executeSql(this.registrarNota, []);

    }
    catch(e){
      this.presentToast("Error en tabla de db: " + e);
    }
  }

  buscarUsuario(userApp: string, claveApp: string){
    return this.database.executeSql('SELECT * FROM USUARIO WHERE USER='+ userApp +' AND CLAVE='+ claveApp +';',[]).then(res=>{
      let items: Usuario[] = [];
      if(res.rows.length > 0){
        for(var i= 0; i<res.rows.length; i++){
          items.push({
            id: res.rows.item(i).ID_USER,
            nombre: res.rows.item(i).NOMBRE,
            apellido: res.rows.item(i).APELLIDO,
            mail: res.rows.item(i).MAIL,
            nivel_educ: res.rows.item(i).NIVEL_EDUC,
            clave: res.rows.item(i).CLAVE,
            usuario: res.rows.item(i).USER
          })
        }
      }
      this.listaUsuarios.next(items as any);
    })
  }

  buscarNota(id_userapp: number){
    return this.database.executeSql('SELECT * FROM NOTA WHERE ID_USER='+ id_userapp+';',[]).then(res=>{
      let items: Nota[] = [];
      if(res.rows.length > 0){
        for(var i= 0; i<res.rows.length; i++){
          items.push({
            id: res.rows.item(i).ID_NOTA,
            id_user: res.rows.item(i).ID_USER,
            detalle: res.rows.item(i).DETALLE
          })
        }
      }
      this.listaNotas.next(items as any);
    })
  }

}
