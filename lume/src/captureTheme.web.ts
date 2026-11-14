// The native screenshot layer is deliberately excluded from the browser bundle.
export async function captureRef(..._args:unknown[]):Promise<string>{throw new Error('Native theme capture only')}
export function releaseCapture(_uri:string){}
