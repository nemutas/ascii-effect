precision highp float;

uniform sampler2D tImage;
uniform sampler2D tAsciiMap;
uniform vec2 uUvTransform;
uniform float uAspect;
uniform float uAsciiColorStep;
uniform float uTileSize;
uniform bool uVisibleImage;

varying vec2 vUv;

void main() {
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 tile = vec2(fract(vUv * aspect * uTileSize));

  vec2 uv = floor(vUv * aspect * uTileSize) * (1.0 / (uTileSize * aspect));
  uv = (uv - 0.5) * uUvTransform + 0.5;

  vec4 image = texture2D(tImage, uv);
  float gray = dot(vec3(0.299, 0.587, 0.114), image.rgb);

  // ascii map の諧調にする
  float shift = floor(gray / uAsciiColorStep) * uAsciiColorStep;
  shift = 1.0 - shift;
  // shift -= uAsciiColorStep;
  tile.x = tile.x * uAsciiColorStep + shift;

  float ascii = texture2D(tAsciiMap, tile).r;
  ascii = smoothstep(0.1, 1.0, ascii);

  vec3 color = vec3(ascii);
  // color *= step(0.05, gray);
  color *= pow(image.rgb, vec3(1.8)) * 1.3;
  color += image.rgb * 0.5 * float(uVisibleImage);
  
  gl_FragColor = vec4(color, 1.0);
}