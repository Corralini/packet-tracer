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
    if (first >= 1 && first <= 126) {
      this.ipType = 'A';
    } else if (first >= 128 && first <= 191) {
      this.ipType = 'B';
    } else {
      this.ipType = 'C';
    }
  }

  generateStates(lenght: number, max: number, broadcast: boolean = false): string [] {
    const states: string[] = [];

    const maxDecimal = parseInt('1'.repeat(lenght - 1), 2);
    if (maxDecimal) {
      for (let i = 0; i <= maxDecimal; i++) {
        // Convert to binary, pad with 0, and add to final results
        states.push(i.toString(2).padStart(lenght - 1, '0') + (broadcast ? '1' : '0').repeat(max - lenght + 1));
      }
    } else {
      states.push((broadcast ? '1' : '0').repeat(max));
    }


    console.log(states);
    return states;

  }

  calculateSubnets() {
    let base;
    let maskAux;
    for (let i = 0; i < this.netmask.length; i = i + 8) {
      maskAux += this.netmask.substring(i, i + 8) + '.';
    }

    console.log(maskAux);

    let subredIp: string;
    let broadcastIp: string;
    let hostBinary: string[];
    let broadcastBinary: string[];

    if (this.ipType === 'A') {
      console.log('tipo A');
      base = this.ip.value.split('.')[0];
      hostBinary = this.generateStates((maskAux.split('.')[1] + maskAux.split('.')[2] + maskAux.split('.')[3])
        .split(1).length, 24);
      broadcastBinary = this.generateStates((maskAux.split('.')[1] + maskAux.split('.')[2] + maskAux.split('.')[3])
        .split(1).length, 24, true);
      hostBinary.forEach((value, index) => {
        subredIp = base + '.' + this.binToDec(value.slice(0, 8)) + '.' + this.binToDec(value.slice(8, 16))
          + '.' + this.binToDec(value.slice(16, 24));
        broadcastIp = base + '.' + this.binToDec(broadcastBinary[index].slice(0, 8))
          + '.' + this.binToDec(broadcastBinary[index].slice(8, 16)) + '.' + this.binToDec(broadcastBinary[index].slice(16, 24));
        this.createSubnet(subredIp, broadcastIp);
        this.subnetsCount++;
      });


    } else if (this.ipType === 'B') {
      console.log('tipo B');
      base = this.ip.value.split('.')[0] + '.' + this.ip.value.split('.')[1];
      hostBinary = this.generateStates((maskAux.split('.')[2] + maskAux.split('.')[3]).split(1).length, 16);
      broadcastBinary = this.generateStates((maskAux.split('.')[2] + maskAux.split('.')[3]).split(1).length, 16, true);

      hostBinary.forEach((value, index) => {
        subredIp = base + '.' + this.binToDec(value.slice(0, 8)) + '.' + this.binToDec(value.slice(8, 16));
        broadcastIp = base + '.' + this.binToDec(broadcastBinary[index].slice(0, 8))
          + '.' + this.binToDec(broadcastBinary[index].slice(8, 16));
        this.createSubnet(subredIp, broadcastIp);
        this.subnetsCount++;
      });

    } else {
      console.log('tipo C');
      base = this.ip.value.split('.')[0] + '.' + this.ip.value.split('.')[1] + '.' + this.ip.value.split('.')[2];
      hostBinary = this.generateStates(maskAux.split('.')[3].split(1).length, 8);
      broadcastBinary = this.generateStates(maskAux.split('.')[3].split(1).length, 8, true);

      hostBinary.forEach((value, index) => {
        subredIp = base + '.' + this.binToDec(value);
        broadcastIp = base + '.' + this.binToDec(broadcastBinary[index]);
        this.createSubnet(subredIp, broadcastIp);
        this.subnetsCount++;
      });
    }


    console.log(this.subredIps);
  }

  createSubnet(subredIp: string, broadcastIp: string) {
    this.subredIps.push({
      subred: subredIp,
      used: false,
      broadcast: broadcastIp,
      nombre: 'Red ' + this.subnetsCount,
      ipRouter: this.calculateNextIp(subredIp),
      firstIp: this.calculateNextIp(this.calculateNextIp(subredIp)),
      lastIp: this.calculatePreviousIp(broadcastIp)
    });
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

  init() {
    this.calculateType();
    this.calculateMask();
    this.calculateSubnets();
    this.createRouter();
  }

  createRouter() {
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
    if (this.subredIps.filter(s => s.used === false)[0]) {
      const newRouter: Router = this.createRouter();
      const routerAsociado = this.routers[indx];
      routerAsociado.connections.push({router: newRouter});

      const interfazNewRouter = this.configureNewRouterIterface(this.createInterface(), newRouter.interfaces.length);
      newRouter.connections.push({router: routerAsociado});
      newRouter.interfaces.push(interfazNewRouter);

      routerAsociado.interfaces.push(this.configureNewRouterIterface({...interfazNewRouter}, routerAsociado.interfaces.length, true));

    } else {
      console.error('No quedan subredes disponibles');
    }
  }

  createAssociatedNet(indx: number) {
    console.log('Create red asociada');
    if (this.subredIps.filter(s => s.used === false)[0]) {
      const routerAsociado = this.routers[indx];
      const interfaz = this.createInterface();
      interfaz.nombre = 'GigabitEthernet' + (routerAsociado.interfaces.length) + '/0';
      routerAsociado.interfaces.push({...interfaz});
      routerAsociado.connections.push({red: interfaz});
    } else {
      console.error('No quedan subredes disponibles');
    }
  }

  createInterface(): Interface {
    console.log('Create interface');
    const subred = this.subredIps.filter(s => s.used === false)[0];
    this.subredIps.filter(sub => sub.subred === subred.subred)[0].used = true;
    return {
      mask: this.maskDecimal,
      red: subred
    };
  }

  configureNewRouterIterface(routerInterface: Interface, length: number, previous: boolean = false): Interface {
    routerInterface.nombre = 'GigabitEthernet' + (length) + '/0';
    routerInterface.red = {...routerInterface.red};
    if (previous) {
      routerInterface.red.ipRouter = this.calculatePreviousIp(routerInterface.red.ipRouter);
    } else {
      routerInterface.red.ipRouter = this.calculateNextIp(routerInterface.red.ipRouter);
      routerInterface.red.firstIp = this.calculateNextIp(routerInterface.red.firstIp);
    }

    return routerInterface;
  }

  calculateNextIp(ip: string) {
    const ipSplitted = ip.split('.');
    let p1 = parseInt(ipSplitted[0], 10);
    let p2 = parseInt(ipSplitted[1], 10);
    let p3 = parseInt(ipSplitted[2], 10);
    let p4 = parseInt(ipSplitted[3], 10);
    if (p4 === 255) {
      if (p3 === 255) {
        if (p2 === 255) {
          if (p1 === 255) {
            console.error('Estás en la última IP');
          } else {
            p1 += 1;
            p2 = 0;
            p3 = 0;
            p4 = 0;
          }
        } else {
          p2 += 1;
          p3 = 0;
          p4 = 0;
        }
      } else {
        p3 += 1;
        p4 = 0;
      }
    } else {
      p4 += 1;
    }

    return p1 + '.' + p2 + '.' + p3 + '.' + p4;
  }

  calculatePreviousIp(ip: string) {
    const ipSplitted = ip.split('.');
    let p1 = parseInt(ipSplitted[0], 10);
    let p2 = parseInt(ipSplitted[1], 10);
    let p3 = parseInt(ipSplitted[2], 10);
    let p4 = parseInt(ipSplitted[3], 10);
    if (p4 === 0) {
      if (p3 === 0) {
        if (p2 === 0) {
          if (p1 === 0) {
            console.error('Estás en la primera IP');
          } else {
            p1 -= 1;
            p2 = 255;
            p3 = 255;
            p4 = 255;
          }
        } else {
          p2 -= 1;
          p3 = 255;
          p4 = 255;
        }
      } else {
        p3 -= 1;
        p4 = 255;
      }
    } else {
      p4 -= 1;
    }

    return p1 + '.' + p2 + '.' + p3 + '.' + p4;
  }
}
