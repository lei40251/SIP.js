export interface HttpDelegate {
    onResponse?(path:string,xhr:XMLHttpRequest):void;
}
