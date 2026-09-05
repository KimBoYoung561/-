import KakaoMap, { KakaoMapProps } from './KakaoMap';

export type MapComponentProps = KakaoMapProps;

export default function MapComponent(props: MapComponentProps) {
  return <KakaoMap {...props} />;
}
