import { defaultClient } from 'applicationinsights';
import { CustomError } from './errors';

const log = (e: (CustomError | Error)) => { 
  //defaultClient.trackException({ exception: e });
  console.error(e);
 };
export default log;