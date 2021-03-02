import {Interface} from './interface';
import {Connection} from './connection';

export interface Router {
  nombre?: string;
  interfaces?: Interface[];
  connections?: Connection[];
}
