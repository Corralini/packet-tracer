import {Component} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormControl} from '@angular/forms';
import {Router} from '../../../common/model/router';
import {Subred} from '../../../common/model/subred';
import {Interface} from '../../../common/model/interface';
import {RoutingTable} from '../../../common/model/RoutingTable';
import {SnotifyPosition, SnotifyService, SnotifyToastConfig} from 'ng-snotify';

@Component({
  selector: 'app-static-mask',
  templateUrl: './static-mask.component.html',
  styleUrls: ['./static-mask.component.css']
})
export class StaticMaskComponent {

  configNotify: SnotifyToastConfig = {
    timeout: 2000,
    showProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    position: SnotifyPosition.rightTop
  };

  constructor(private modalService: NgbModal, private snotifyServce: SnotifyService) {
  }

  numRedes = new FormControl('');
  numHost = new FormControl('');

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
  selectedRouter: Router;
  config: string;


  calculateIp(): void {
    if (this.numRedes && this.numHost) {
      let countNets = 0;
      let countHosts = 0;
      let pow = Math.pow(2, countNets) - 2;
      while (pow <= this.numHost.value) {
        countNets++;
        pow = Math.pow(2, countNets) - 2;
      }
      if (countNets > 0 && countNets < 8) {
        countHosts = 8 - countNets;

        if (Math.pow(2, countHosts) >= this.numRedes.value) {
          this.ipType = 'C';
        } else {
          this.ipType = 'B';
        }
      } else if (countNets < 16) {
        countHosts = 16 - countNets;
        if (Math.pow(2, countHosts) >= this.numRedes.value) {
          this.ipType = 'B';
        } else {
          this.ipType = 'A';
        }
      } else {
        countHosts = 24 - countNets;
        if (Math.pow(2, countHosts) >= this.numRedes.value) {
          this.ipType = 'A';
        } else {
          this.snotifyServce.error('Demasiadas subredes', 'Error', this.configNotify);
        }
      }

      if (this.ipType === 'C') {
        this.ip.setValue('192.168.100.0');
      } else if (this.ipType === 'B') {
        this.ip.setValue('140.140.0.0');
      } else {
        this.ip.setValue('10.0.0.0');
      }

      this.mask.setValue(32 - countNets);


    } else {
      this.snotifyServce.error('Datos obligatorios', 'Error', this.configNotify);
    }
  }

  calculateMask(): void {
    this.maskDecimal = '';
    this.netmask = ('1'.repeat(parseInt(this.mask.value, 10)) + '0'.repeat(32 - parseInt(this.mask.value, 10)));
    for (let i = 0; i < this.netmask.length; i = i + 8) {
      this.maskDecimal += this.binToDec(this.netmask.substring(i, i + 8));
      if (i !== 24) {
        this.maskDecimal += '.';
      }
    }
  }

  calculateType(): void {
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


    return states;

  }

  calculateSubnets(): void {
    let base;
    let maskAux;
    for (let i = 0; i < this.netmask.length; i = i + 8) {
      maskAux += this.netmask.substring(i, i + 8) + '.';
    }


    let subredIp: string;
    let broadcastIp: string;
    let hostBinary: string[];
    let broadcastBinary: string[];

    if (this.ipType === 'A') {
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


  }

  createSubnet(subredIp: string, broadcastIp: string): void {
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

  binToDec(num): number {
    let dec = 0;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < num.length; i++) {
      dec *= 2;
      dec += +num[i];
    }
    return dec;
  }

  init(): void {
    this.calculateType();
    this.calculateMask();
    this.calculateSubnets();
    this.createRouter();
  }

  createRouter(): Router {
    const router: Router = {
      nombre: 'Router' + this.letters.charAt(this.routerIdx).toUpperCase(),
      interfaces: [],
      connections: []
    };
    this.routerIdx++;
    this.routers.push(router);
    return router;
  }

  createAssociatedRouter(indx: number): void {
    if (this.subredIps.filter(s => s.used === false)[0]) {
      const newRouter: Router = this.createRouter();
      const routerAsociado = this.routers[indx];
      routerAsociado.connections.push({router: newRouter, show: false});

      const interfazNewRouter = this.configureNewRouterIterface(this.createInterface(), newRouter.interfaces.length);
      newRouter.connections.push({router: routerAsociado, show: false});
      newRouter.interfaces.push(interfazNewRouter);

      routerAsociado.interfaces.push(this.configureNewRouterIterface({...interfazNewRouter}, routerAsociado.interfaces.length, true));

    } else {
      this.snotifyServce.error('No quedan subredes disponibles', 'Error', this.configNotify);
    }
  }

  createAssociatedNet(indx: number): void {
    if (this.subredIps.filter(s => s.used === false)[0]) {
      const routerAsociado = this.routers[indx];
      const interfaz = this.createInterface();
      interfaz.disableLinkRouter = true;
      interfaz.nombre = 'GigabitEthernet' + (routerAsociado.interfaces.length) + '/0';
      routerAsociado.interfaces.push({...interfaz});
      routerAsociado.connections.push({red: interfaz, show: false});
    } else {
      this.snotifyServce.error('No quedan subredes disponibles', 'Error', this.configNotify);
    }
  }

  createInterface(): Interface {
    const subred = this.subredIps.filter(s => s.used === false)[0];
    this.subredIps.filter(sub => sub.subred === subred.subred)[0].used = true;
    return {
      mask: this.maskDecimal,
      red: subred,
      show: false
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

  calculateNextIp(ip: string): string {
    const ipSplitted = ip.split('.');
    let p1 = parseInt(ipSplitted[0], 10);
    let p2 = parseInt(ipSplitted[1], 10);
    let p3 = parseInt(ipSplitted[2], 10);
    let p4 = parseInt(ipSplitted[3], 10);
    if (p4 === 255) {
      if (p3 === 255) {
        if (p2 === 255) {
          if (p1 === 255) {
            this.snotifyServce.error('Se ha alcanzado la última IP', 'Error', this.configNotify);
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

  calculatePreviousIp(ip: string): string {
    const ipSplitted = ip.split('.');
    let p1 = parseInt(ipSplitted[0], 10);
    let p2 = parseInt(ipSplitted[1], 10);
    let p3 = parseInt(ipSplitted[2], 10);
    let p4 = parseInt(ipSplitted[3], 10);
    if (p4 === 0) {
      if (p3 === 0) {
        if (p2 === 0) {
          if (p1 === 0) {
            this.snotifyServce.error('Se ha alcanzado la primera IP', 'Error', this.configNotify);
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

  createAssociatedRouterInterface(idx: number, interfaceIdx: number): void {
    const routerAsociado = this.routers[idx];
    const interdazAsociada = routerAsociado.interfaces[interfaceIdx];
    if (this.subredIps.filter(s => s.used === false)[0]) {
      const newRouter = this.createRouter();
      const newInterfaz = {...interdazAsociada};
      newInterfaz.nombre = 'GigabitEthernet' + (newRouter.interfaces.length) + '/0';
      newInterfaz.red = {...newInterfaz.red};
      newInterfaz.red.ipRouter = newInterfaz.red.firstIp;
      newRouter.interfaces.push(newInterfaz);
      newRouter.connections.push({router: routerAsociado, show: false});
      routerAsociado.connections.push({
        router: newRouter
      });
      this.routers.forEach((routerIterate) => {
        routerIterate.interfaces.filter((interfaceSearch) => interfaceSearch.red.subred === interdazAsociada.red.subred).forEach(
          (interfaz) => this.interfaceNextIpFirst(interfaz)
        );
      });
    } else {
      this.snotifyServce.error('No quedan subredes disponibles', 'Error', this.configNotify);
    }
  }

  interfaceNextIpFirst(routerInterface: Interface): Interface {
    routerInterface.red = {...routerInterface.red};
    routerInterface.red.firstIp = this.calculateNextIp(routerInterface.red.firstIp);
    return routerInterface;
  }

  generatePacketTraceCommands(router: Router, modal: any): void {
    this.config = 'en \n';
    router.interfaces.forEach(value => {
      this.config += 'conf t \n';
      this.config += `int ${value.nombre} \n`;
      this.config += `ip address ${value.red.ipRouter} ${value.mask} \n`;
      this.config += 'no shutdown \n';
      this.config += 'exit \n';
    });
    const routingTables = this.createRoutingTable(router);
    routingTables.forEach(routingTable => {
      this.config += `ip route ${routingTable.redDestino} ${routingTable.mask} ${routingTable.puertaEnlace} \n`;
    });
    this.config += 'exit \n';
    this.selectedRouter = router;
    this.openModal(modal);

  }

  restart(): void {
    this.routers = [];
    this.subredIps = [];
    this.subnetsCount = 0;
    this.routerIdx = 0;
    this.maskDecimal = undefined;
  }

  openModal(content): void {
    this.modalService.open(content);
  }

  createRoutingTable(router: Router): RoutingTable[] {
    let outNets = this.subredIps.filter(subred => subred.used === true);
    const routingTable: RoutingTable[] = [];
    router.interfaces.forEach(interfaceRouter => {
      outNets = outNets.filter(usNet => usNet.subred !== interfaceRouter.red.subred);
    });
    if (outNets && outNets.length > 0) {
      outNets.forEach(net => {
        let routersWithNet = this.routers.filter(value => value !== router);
        routersWithNet = routersWithNet.filter(rout => rout.interfaces.find(value => value.red.subred === net.subred));
        let deepCopy = this.routers.filter(value => value !== router);
        deepCopy = deepCopy.filter(rout => rout.interfaces.find(value => value.red.subred === net.subred));
        routersWithNet.forEach(rout => {
          if (!routingTable.find(rt => rt && rt.redDestino === net.subred)) {
            routingTable.push(this.createRoutTable(rout, router, net, routingTable));
          }
        });
      });
    }
    return routingTable;
  }

  createRoutTable(routerConfig: Router, otherRouter: Router, redDestino: Subred, routingTables: RoutingTable[]): RoutingTable {
    let routingTable: RoutingTable;
    if (!routingTable && routerConfig.connections.find(value => value.router && value.router.nombre === otherRouter.nombre)) {
      const interfaces: Interface[] = [];
      routerConfig.interfaces.forEach(inter => {
        if (otherRouter.interfaces.find(value => value.red.subred === inter.red.subred)) {
          interfaces.push(inter);
        }
      });
      routingTable = {
        mask: this.maskDecimal,
        puertaEnlace: interfaces[0].red.ipRouter,
        redDestino: redDestino.subred
      };
    } else {
      routerConfig.connections.forEach(con => {
        if (!routingTable && con.router) {
          routingTable = this.createRoutTable(con.router, otherRouter, redDestino, routingTables);
        }
      });
    }
    return routingTable;
  }

}
