import {Router} from './router';
import {Subred} from './subred';

export interface Connection {
  router?: Router;
  red?: Subred;
}
