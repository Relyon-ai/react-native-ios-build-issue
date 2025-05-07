declare module "*.svg" {
  import React from 'react';
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '@env' {
  export const PORCUPINE_KEY: string;
  export const API_KEY: string;
  export const IP_STACK_KEY: string;
  export const REVENUE_CAT_IOS_KEY: string;
  export const REVENUE_CAT_ANDROID_KEY: string;
  export const PUSHER_API_KEY: string;
  export const PUSHER_CLUSTER: string;
  export const GOOGLE_MAPS_ANDROID_KEY: string;
  export const GOOGLE_MAPS_IOS_KEY: string;
}
