import {Component} from '@angular/core';
import {Router} from './model/router';
import {FormControl} from '@angular/forms';
import {Subred} from './model/subred';
import {Interface} from './model/interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  ip = new FormControl('');
  mask = new FormControl('');
  letters = 'abcdefghijklmnopqrstuvwxyz';
  routers: Router[] = [];
  routerIdx = 0;
  netmask;
  maskDecimal;
  ipType;
  subredIps: Subred [] = [];
  subnetsCount = 0;

  calculateMask() {
    this.maskDecimal = '';
    this.netmask = ('1'.repeat(parseInt(this.mask.value, 10)) + '0'.repeat(32 - parseInt(this.mask.value, 10)));
    for (let i = 0; i < this.netmask.length; i = i + 8) {
      this.maskDecimal += this.binToDec(this.netmask.substring(i, i + 8)) + '.';
    }
    console.log('mascara' + this.maskDecimal);

  }

  calculateType() {
    const first = this.ip.value.split('.')[0];
    if (this.ip.value >= 1 && this.ip.value <= 126) {
      this.ipType = 'A';
    } else if (this.ip.value >= 128 && this.ip.value <= 191) {
      this.ipType = 'B';
    } else {
      this.ipType = 'C';
    }
  }

  generateStates(lenght: number, broadcast: boolean = false) {
    const states: string[] = [];

    const maxDecimal = parseInt('1'.repeat(lenght), 2);

    for (let i = 0; i <= maxDecimal; i++) {
      // Convert to binary, pad with 0, and add to final results
      states.push(i.toString(2).padStart(lenght, '0') + (broadcast ? '1' : '0').repeat(8 - lenght));
    }

    return states;

  }

  calculateSubnets() {
    let base;
    let maskAux;
    for (let i = 0; i < this.netmask.length; i = i + 8) {
      maskAux += this.netmask.substring(i, i + 8) + '.';
    }

    console.log(maskAux);

    if (this.ipType === 'A') {
      console.log('tipo A');
    } else if (this.ipType === 'B') {
      console.log('tipo B');
    } else {
      console.log('tipo C');
      base = this.ip.value.split('.')[0] + '.' + this.ip.value.split('.')[1] + '.' + this.ip.value.split('.')[2];
      const hostBinary = this.generateStates(maskAux.split('.')[3].split(1).length - 1);
      const broadcastBinary = this.generateStates(maskAux.split('.')[3].split(1).length - 1, true);
      console.log(hostBinary);

      hostBinary.forEach((value, index) => {
        this.subredIps.push({
          subred: base + '.' + this.binToDec(value),
          used: false,
          broadcast: base + '.' + this.binToDec(broadcastBinary[index]),
          nombre: 'Red: ' + this.subnetsCount,
          ipRouter: base + '.' + (this.binToDec(value) + 1),
          firstIp: base + '.' + (this.binToDec(value) + 2),
          lastIp: base + '.' + (this.binToDec(broadcastBinary[index]) - 1)
        });
      });
    }

    console.log(this.subredIps);
  }

  binToDec(num) {
    let dec = 0;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < num.length; i++) {
      dec *= 2;
      dec += +num[i];
    }
    return dec;
  }


  createRouter() {
    this.calculateType();
    this.calculateMask();
    this.calculateSubnets();
    console.log('create router', this.ip.value, this.mask.value);
    const router: Router = {
      nombre: 'Router' + this.letters.charAt(this.routerIdx).toUpperCase(),
      interfaces: [],
      connections: []
    };
    this.routerIdx++;
    this.routers.push(router);
    return router;
  }

  deleteRouter(indx: number) {
    console.log('Borrando ' + indx);
    this.routers.splice(indx, 1);
  }

  createAssociatedRouter(indx: number) {
    console.log('Crear router asociado');
    const newRouter: Router = this.createRouter();
    const routerAsociado = this.routers[indx];
    routerAsociado.connections.push({router: newRouter});
    const interfaz = this.createInterface();
    interfaz.nombre = 'GigabitEthernet' + (routerAsociado.interfaces.length) + '/0';
    routerAsociado.interfaces.push(interfaz);
    newRouter.connections.push({router: routerAsociado});
    interfaz.nombre = 'GigabitEthernet' + (newRouter.interfaces.length) + '/0';
    newRouter.interfaces.push(interfaz);
  }

  createInterface(): Interface {
    console.log('Create interface');
    const subred = this.subredIps.filter(s => s.used === false)[0];
    return {
      mask: this.maskDecimal,
      red: subred
    };
  }
}
