@group(0) @binding(0)
var<uniform> config: TwoPassConfig;
@group(0) @binding(1)
var<storage, read> addresses: array<u32>;
@group(0) @binding(2)
var<storage, read> fine_renderable_faces: array<TwoPassFineRenderableFace>;
@group(0) @binding(3)
var<storage, read> render_program_instructions: array<u32>;
@group(0) @binding(4)
var<storage, read> edges: array<LinearEdge>;
@group(0) @binding(5)
var output: texture_storage_2d<bgra8unorm, write>;
struct TwoPassFineRenderableFace {
  bits: u32,
  edges_index: u32,
  num_edges: u32,
  clip_counts: u32,
  next_address: u32
}
fn unpremultiply( color: vec4f ) -> vec4f {
  let a_inv = 1.0 / max( color.a, 1e-6 );
  return vec4( color.rgb * a_inv, color.a );
}
const lss_inv_gamma = 1.0 / 2.4;
fn linear_sRGB_to_sRGB( color: vec3f ) -> vec3f {
  return select( 1.055 * pow( color, vec3( lss_inv_gamma ) ) - 0.055, color * 12.92, color <= vec3( 0.00313066844250063 ) );
}
fn is_color_in_range( color: vec3f ) -> bool {
  return all( color >= vec3( 0f ) ) && all( color <= vec3( 1f ) );
}
fn cbrt( x: f32 ) -> f32 {
  var y = sign( x ) * bitcast<f32>( bitcast<u32>( abs( x ) ) / 3u + 0x2a514067u );
  y = ( 2. * y + x / ( y * y ) ) * .333333333;
  y = ( 2. * y + x / ( y * y ) ) * .333333333;
  let y3 = y * y * y;
  y *= ( y3 + 2. * x ) / ( 2. * y3 + x );
  return y;
}
fn linear_sRGB_to_oklab( color: vec3f ) -> vec3f {
  let l = 0.4122214708 * color.r + 0.5363325363 * color.g + 0.0514459929 * color.b;
  let m = 0.2119034982 * color.r + 0.6806995451 * color.g + 0.1073969566 * color.b;
  let s = 0.0883024619 * color.r + 0.2817188376 * color.g + 0.6299787005 * color.b;
  let l_ = cbrt( l );
  let m_ = cbrt( m );
  let s_ = cbrt( s );
  return vec3(
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  );
}
fn oklab_to_linear_sRGB( color: vec3f ) -> vec3f {
  let l_ = color.x + 0.3963377774 * color.y + 0.2158037573 * color.z;
  let m_ = color.x - 0.1055613458 * color.y - 0.0638541728 * color.z;
  let s_ = color.x - 0.0894841775 * color.y - 1.2914855480 * color.z;
  let l = l_ * l_ * l_;
  let m = m_ * m_ * m_;
  let s = s_ * s_ * s_;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  );
}
fn gamut_map_linear_sRGB( color: vec3f ) -> vec3f {
  if ( is_color_in_range( color ) ) {
    return color;
  }
  var oklab = linear_sRGB_to_oklab( color );
  if ( oklab.x <= 0f ) {
    return vec3( 0f );
  }
  else if ( oklab.x >= 1f ) {
    return vec3( 1f );
  }
  let chroma = oklab.yz;
  var lowChroma = 0f;
  var highChroma = 1f;
  var clipped = vec3( 0f );
  while ( highChroma - lowChroma > 1e-4f ) {
    let testChroma = ( lowChroma + highChroma ) * 0.5;
    oklab = vec3(
      oklab.x,
      chroma * testChroma
    );
    let mapped = oklab_to_linear_sRGB( oklab );
    let isInColorRange = is_color_in_range( mapped );
    clipped = select( clamp( mapped, vec3( 0f ), vec3( 1f ) ), mapped, isInColorRange );
    if ( isInColorRange || distance( linear_sRGB_to_oklab( clipped ), oklab ) <= 0.02 ) {
      lowChroma = testChroma;
    }
    else {
      highChroma = testChroma;
    }
  }
  let potentialResult = oklab_to_linear_sRGB( oklab );
  if ( is_color_in_range( potentialResult ) ) {
    return potentialResult;
  }
  else {
    return clipped;
  }
}
fn linear_displayP3_to_linear_sRGB( color: vec3f ) -> vec3f {
  return vec3(
    1.2249297438736997 * color.r + -0.2249297438736996 * color.g,
    -0.04205861411592876 * color.r + 1.0420586141159287 * color.g,
    -0.019641278613420788 * color.r + -0.07864798001761002 * color.g + 1.0982892586310309 * color.b
  );
}
fn linear_sRGB_to_linear_displayP3( color: vec3f ) -> vec3f {
  return vec3(
    0.8224689734082459 * color.r + 0.17753102659175413 * color.g,
    0.03319573842230447 * color.r + 0.9668042615776956 * color.g,
    0.017085772151775966 * color.r + 0.07240728066524241 * color.g + 0.9105069471829815 * color.b
  );
}
fn gamut_map_linear_displayP3( color: vec3f ) -> vec3f {
  if ( is_color_in_range( color ) ) {
    return color;
  }
  var oklab = linear_sRGB_to_oklab( linear_displayP3_to_linear_sRGB( color ) );
  if ( oklab.x <= 0f ) {
    return vec3( 0f );
  }
  else if ( oklab.x >= 1f ) {
    return vec3( 1f );
  }
  let chroma = oklab.yz;
  var lowChroma = 0f;
  var highChroma = 1f;
  var clipped = vec3( 0f );
  while ( highChroma - lowChroma > 1e-4f ) {
    let testChroma = ( lowChroma + highChroma ) * 0.5;
    oklab = vec3(
      oklab.x,
      chroma * testChroma
    );
    let mapped = linear_sRGB_to_linear_displayP3( oklab_to_linear_sRGB( oklab ) );
    let isInColorRange = is_color_in_range( mapped );
    clipped = select( clamp( mapped, vec3( 0f ), vec3( 1f ) ), mapped, isInColorRange );
    if ( isInColorRange || distance( linear_sRGB_to_oklab( linear_displayP3_to_linear_sRGB( clipped ) ), oklab ) <= 0.02 ) {
      lowChroma = testChroma;
    }
    else {
      highChroma = testChroma;
    }
  }
  let potentialResult = linear_sRGB_to_linear_displayP3( oklab_to_linear_sRGB( oklab ) );
  if ( is_color_in_range( potentialResult ) ) {
    return potentialResult;
  }
  else {
    return clipped;
  }
}
fn premultiply( color: vec4f ) -> vec4f {
  return vec4( color.xyz * color.w, color.w );
}
struct LinearEdge {
  startPoint: vec2f,
  endPoint: vec2f
}
struct bounds_clip_edge_Result {
  edges: array<LinearEdge,3>,
  count: u32
}
struct MD_ClipResult {
  p0: vec2f,
  p1: vec2f,
  clipped: bool
}
fn matthes_drakopoulos_clip(
  p0: vec2f,
  p1: vec2f,
  minX: f32,
  minY: f32,
  maxX: f32,
  maxY: f32
) -> MD_ClipResult {
  if (
    !( p0.x < minX && p1.x < minX ) &&
    !( p0.x > maxX && p1.x > maxX ) &&
    !( p0.y < minY && p1.y < minY ) &&
    !( p0.y > maxY && p1.y > maxY )
  ) {
    var x0 = p0.x;
    var y0 = p0.y;
    var x1 = p1.x;
    var y1 = p1.y;
    if ( x0 < minX ) {
      x0 = minX;
      y0 = ( p1.y - p0.y ) * ( minX - p0.x ) / ( p1.x - p0.x ) + p0.y;
    }
    else if ( x0 > maxX ) {
      x0 = maxX;
      y0 = ( p1.y - p0.y ) * ( maxX - p0.x ) / ( p1.x - p0.x ) + p0.y;
    }
    if ( y0 < minY ) {
      y0 = minY;
      x0 = ( p1.x - p0.x ) * ( minY - p0.y ) / ( p1.y - p0.y ) + p0.x;
    }
    else if ( y0 > maxY ) {
      y0 = maxY;
      x0 = ( p1.x - p0.x ) * ( maxY - p0.y ) / ( p1.y - p0.y ) + p0.x;
    }
    if ( x1 < minX ) {
      x1 = minX;
      y1 = ( p1.y - p0.y ) * ( minX - p0.x ) / ( p1.x - p0.x ) + p0.y;
    }
    else if ( x1 > maxX ) {
      x1 = maxX;
      y1 = ( p1.y - p0.y ) * ( maxX - p0.x ) / ( p1.x - p0.x ) + p0.y;
    }
    if ( y1 < minY ) {
      y1 = minY;
      x1 = ( p1.x - p0.x ) * ( minY - p0.y ) / ( p1.y - p0.y ) + p0.x;
    }
    else if ( y1 > maxY ) {
      y1 = maxY;
      x1 = ( p1.x - p0.x ) * ( maxY - p0.y ) / ( p1.y - p0.y ) + p0.x;
    }
    if ( !( x0 < minX && x1 < minX ) && !( x0 > maxX && x1 > maxX ) ) {
      return MD_ClipResult( vec2( x0, y0 ), vec2( x1, y1 ), true );
    }
  }
  return MD_ClipResult( p0, p1, false );
}
fn bounds_clip_edge(
  edge: LinearEdge,
  minX: f32,
  minY: f32,
  maxX: f32,
  maxY: f32,
  centerX: f32,
  centerY: f32
) -> bounds_clip_edge_Result {
  var edges: array<LinearEdge,3>;
  var count: u32 = 0u;
  let startPoint = edge.startPoint;
  let endPoint = edge.endPoint;
  let clipResult: MD_ClipResult = matthes_drakopoulos_clip( startPoint, endPoint, minX, minY, maxX, maxY );
  let clippedStartPoint = clipResult.p0;
  let clippedEndPoint = clipResult.p1;
  let clipped = clipResult.clipped;
  let startXLess = startPoint.x < centerX;
  let startYLess = startPoint.y < centerY;
  let endXLess = endPoint.x < centerX;
  let endYLess = endPoint.y < centerY;
  let needsStartCorner = !clipped || !all( startPoint == clippedStartPoint );
  let needsEndCorner = !clipped || !all( endPoint == clippedEndPoint );
  let startCorner = vec2(
    select( maxX, minX, startXLess ),
    select( maxY, minY, startYLess )
  );
  let endCorner = vec2(
    select( maxX, minX, endXLess ),
    select( maxY, minY, endYLess )
  );
  if ( clipped ) {
    if ( needsStartCorner && !all( startCorner == clippedStartPoint ) ) {
      edges[ count ] = LinearEdge( startCorner, clippedStartPoint );
      count++;
    }
    if ( !all( clippedStartPoint == clippedEndPoint ) ) {
      edges[ count ] = LinearEdge( clippedStartPoint, clippedEndPoint );
      count++;
    }
    if ( needsEndCorner && !all( endCorner == clippedEndPoint ) ) {
      edges[ count ] = LinearEdge( clippedEndPoint, endCorner );
      count++;
    }
  }
  else {
    if ( startXLess != endXLess && startYLess != endYLess ) {
      let y = startPoint.y + ( endPoint.y - startPoint.y ) * ( centerX - startPoint.x ) / ( endPoint.x - startPoint.x );
      let startSame = startXLess == startYLess;
      let yGreater = y > centerY;
      let middlePoint = vec2(
        select( maxX, minX, startSame == yGreater ),
        select( minY, maxY, yGreater )
      );
      edges[ 0u ] = LinearEdge( startCorner, middlePoint );
      edges[ 1u ] = LinearEdge( middlePoint, endCorner );
      count = 2u;
    }
    else if ( !all( startCorner == endCorner ) ) {
      edges[ 0u ] = LinearEdge( startCorner, endCorner );
      count = 1u;
    }
  }
  return bounds_clip_edge_Result( edges, count );
}
const sls_inv_1055 = 1.0 / 1.055;
const sls_inv_1292 = 1.0 / 12.92;
fn sRGB_to_linear_sRGB( color: vec3f ) -> vec3f {
  return select( pow( ( color + 0.055 ) * sls_inv_1055, vec3( 2.4 ) ), color * sls_inv_1292, color <= vec3( 0.0404482362771082 ) );
}
fn screen(cb: vec3f, cs: vec3f) -> vec3f {
  return cb + cs - (cb * cs);
}
fn color_dodge(cb: f32, cs: f32) -> f32 {
  if cb == 0.0 {
    return 0.0;
  } else if cs == 1.0 {
    return 1.0;
  } else {
    return min(1.0, cb / (1.0 - cs));
  }
}
fn color_burn(cb: f32, cs: f32) -> f32 {
  if cb == 1.0 {
    return 1.0;
  } else if cs == 0.0 {
    return 0.0;
  } else {
    return 1.0 - min(1.0, (1.0 - cb) / cs);
  }
}
fn hard_light(cb: vec3f, cs: vec3f) -> vec3f {
  return select(
    screen(cb, 2.0 * cs - 1.0),
    cb * 2.0 * cs,
    cs <= vec3(0.5)
  );
}
fn soft_light(cb: vec3f, cs: vec3f) -> vec3f {
  let d = select(
    sqrt(cb),
    ((16.0 * cb - 12.0) * cb + 4.0) * cb,
    cb <= vec3(0.25)
  );
  return select(
    cb + (2.0 * cs - 1.0) * (d - cb),
    cb - (1.0 - 2.0 * cs) * cb * (1.0 - cb),
    cs <= vec3(0.5)
  );
}
fn sat(c: vec3f) -> f32 {
  return max(c.x, max(c.y, c.z)) - min(c.x, min(c.y, c.z));
}
fn lum(c: vec3f) -> f32 {
  let f = vec3(0.3, 0.59, 0.11);
  return dot(c, f);
}
fn clip_color(c_in: vec3f) -> vec3f {
  var c = c_in;
  let l = lum(c);
  let n = min(c.x, min(c.y, c.z));
  let x = max(c.x, max(c.y, c.z));
  if n < 0.0 {
    c = l + (((c - l) * l) / (l - n));
  }
  if x > 1.0 {
    c = l + (((c - l) * (1.0 - l)) / (x - l));
  }
  return c;
}
fn set_lum(c: vec3f, l: f32) -> vec3f {
  return clip_color(c + (l - lum(c)));
}
fn set_sat_inner(
  cmin: ptr<function, f32>,
  cmid: ptr<function, f32>,
  cmax: ptr<function, f32>,
  s: f32
) {
  if *cmax > *cmin {
    *cmid = ((*cmid - *cmin) * s) / (*cmax - *cmin);
    *cmax = s;
  } else {
    *cmid = 0.0;
    *cmax = 0.0;
  }
  *cmin = 0.0;
}
fn set_sat(c: vec3f, s: f32) -> vec3f {
  var r = c.r;
  var g = c.g;
  var b = c.b;
  if r <= g {
    if g <= b {
      set_sat_inner(&r, &g, &b, s);
    } else {
      if r <= b {
        set_sat_inner(&r, &b, &g, s);
      } else {
        set_sat_inner(&b, &r, &g, s);
      }
    }
  } else {
    if r <= b {
      set_sat_inner(&g, &r, &b, s);
    } else {
      if g <= b {
        set_sat_inner(&g, &b, &r, s);
      } else {
        set_sat_inner(&b, &g, &r, s);
      }
    }
  }
  return vec3(r, g, b);
}
fn blend_compose( a: vec4f, b: vec4f, composeType: u32, blendType: u32 ) -> vec4f {
  var blended: vec4f;
  if ( blendType == 0u ) {
    blended = a;
  }
  else {
    let a3 = unpremultiply( a ).rgb;
    let b3 = unpremultiply( b ).rgb;
    var c3: vec3f;
    switch ( blendType ) {
      case 1u: {
        c3 = b3 * a3;
      }
      case 2u: {
        c3 = screen( b3, a3 );
      }
      case 3u: {
        c3 = hard_light( a3, b3 );
      }
      case 4u: {
        c3 = min( b3, a3 );
      }
      case 5u: {
        c3 = max( b3, a3 );
      }
      case 6u: {
        c3 = vec3(
          color_dodge( b3.x, a3.x ),
          color_dodge( b3.y, a3.y ),
          color_dodge( b3.z, a3.z )
        );
      }
      case 7u: {
        c3 = vec3(
          color_burn( b3.x, a3.x ),
          color_burn( b3.y, a3.y ),
          color_burn( b3.z, a3.z )
        );
      }
      case 8u: {
        c3 = hard_light( b3, a3 );
      }
      case 9u: {
        c3 = soft_light( b3, a3 );
      }
      case 10u: {
        c3 = abs( b3 - a3 );
      }
      case 11u: {
        c3 = b3 + a3 - 2f * b3 * a3;
      }
      case 12u: {
        c3 = set_lum( set_sat( a3, sat( b3 ) ), lum( b3 ) );
      }
      case 13u: {
        c3 = set_lum( set_sat( b3, sat( a3 ) ), lum( b3 ) );
      }
      case 14u: {
        c3 = set_lum( a3, lum( b3 ) );
      }
      case 15u: {
        c3 = set_lum( b3, lum( a3 ) );
      }
      default: {
        c3 = a3;
      }
    }
    blended = premultiply( vec4( c3, a.a ) );
  }
  var fa: f32;
  var fb: f32;
  switch( composeType ) {
    case 0u: {
      fa = 1f;
      fb = 1f - a.a;
    }
    case 1u: {
      fa = b.a;
      fb = 0f;
    }
    case 2u: {
      fa = 1f - b.a;
      fb = 0f;
    }
    case 3u: {
      fa = b.a;
      fb = 1f - a.a;
    }
    case 4u: {
      fa = 1f - b.a;
      fb = 1f - a.a;
    }
    case 5u: {
      fa = 1f;
      fb = 1f;
    }
    case 6u: {
      return min( vec4( 1f ), vec4( a + b ) );
    }
    default: {}
  }
  return vec4( fa * blended.rgb + fb * b.rgb, fa * a.a + fb * b.a );
}
fn extend_f32( t: f32, extend: u32 ) -> f32 {
  switch ( extend ) {
    case 0u: {
      return clamp( t, 0f, 1f );
    }
    case 2u: {
      return fract( t );
    }
    case 1u: {
      return abs( t - 2f * round( 0.5f * t ) );
    }
    default: {
      return t;
    }
  }
}
const oops_inifinite_loop_code = vec4f( 0.5f, 0.5f, 0f, 0.5f );
const low_area_multiplier = 0.0002f;
var<workgroup> bin_xy: vec2<u32>;
var<workgroup> workgroup_exit: bool;
var<workgroup> next_address: u32;
var<workgroup> current_face: TwoPassFineRenderableFace;
var<workgroup> shared_integrals: array<f32, 1024>;
var<workgroup> shared_colors: array<vec4<f32>, 256>;
@compute @workgroup_size(256)
fn main(
  @builtin(global_invocation_id) global_id: vec3u,
  @builtin(local_invocation_id) local_id: vec3u,
  @builtin(workgroup_id) workgroup_id: vec3u
) {
  if ( local_id.x == 0u ) {
    let bin_index = workgroup_id.x;
    let tile_index = bin_index >> 8u;
    let tile_xy = vec2( tile_index % config.tile_width, tile_index / config.tile_width );
    let base_bin_xy = vec2( 16u ) * tile_xy;
    let sub_bin_index = bin_index & 0xffu;
    bin_xy = base_bin_xy + vec2( sub_bin_index % 16u, sub_bin_index / 16u );
    next_address = addresses[ bin_index + 2u ];
    workgroup_exit = bin_xy.x >= config.bin_width || bin_xy.y >= config.bin_height;
  }
  workgroupBarrier();
  if ( workgroupUniformLoad( &workgroup_exit ) ) {
    return;
  }
  let pixel_xy = bin_xy * config.bin_size + vec2( local_id.x % 16u, local_id.x / 16u );
  let skip_pixel = pixel_xy.x >= config.raster_width || pixel_xy.y >= config.raster_height;
  var accumulation = vec4f( 0f, 0f, 0f, 0f );
  var oops_count = 0u;
  while ( workgroupUniformLoad( &next_address ) != 0xffffffffu ) {
    oops_count++;
    if ( oops_count > 0xfffu ) {
      accumulation = oops_inifinite_loop_code;
      break;
    }
    if ( local_id.x == 0u ) {
      current_face = fine_renderable_faces[ next_address ];
      next_address = current_face.next_address;
    }
    workgroupBarrier();
    let needs_centroid = ( current_face.bits & 0x10000000u ) != 0u;
    let needs_face = ( current_face.bits & 0x20000000u ) != 0u;
    let is_full_area = ( current_face.bits & 0x80000000u ) != 0u;
    let render_program_index = current_face.bits & 0x00ffffffu;
    if ( config.filter_type == 0u ) {
      if ( !skip_pixel ) {
        let bounds_centroid = vec2f( pixel_xy ) + vec2( 0.5f );
        let radius_partial = vec2( 0.5f * config.filter_scale );
        let min = bounds_centroid - radius_partial;
        let max = bounds_centroid + radius_partial;
        accumulate_box( &accumulation, min, max, bounds_centroid, render_program_index, is_full_area, needs_centroid );
      }
    }
    else if ( config.filter_type == 1u ) {
      if ( config.filter_scale == 1f ) {
        let min = vec2f( pixel_xy ) - vec2( 0.5f );
        let max = vec2f( pixel_xy ) + vec2( 0.5f );
        accumulate_grid_bilinear( &accumulation, min, max, local_id, render_program_index, is_full_area, needs_centroid );
      }
      else
      {
        if ( !skip_pixel ) {
          let mid = vec2f( pixel_xy ) + vec2( 0.5f );
          let radius_partial = vec2( config.filter_scale );
          let min = mid - radius_partial;
          let max = mid + radius_partial;
          accumulate_bilinear( &accumulation, min, mid, max, render_program_index, is_full_area, needs_centroid );
        }
      }
    }
  }
  var will_store_pixel = !skip_pixel;
  if ( will_store_pixel && config.filter_type != 0u && config.filter_scale == 1f ) {
    let cutoff = select( 13u, 15u, config.filter_type == 1u );
    if ( local_id.x / 16u >= cutoff || local_id.x % 16u >= cutoff ) {
      will_store_pixel = false;
    }
  }
  if ( will_store_pixel ) {
    let linear_unmapped_color = unpremultiply( accumulation );
    var output_color = vec4( 0f );
    if ( linear_unmapped_color.a > 1e-8f ) {
      switch ( config.raster_color_space ) {
        case 0u: {
          output_color = vec4(
            linear_sRGB_to_sRGB( gamut_map_linear_sRGB( linear_unmapped_color.rgb ) ),
            min( 1f, linear_unmapped_color.a )
          );
        }
        case 1u: {
          output_color = vec4(
            linear_sRGB_to_sRGB( gamut_map_linear_displayP3( linear_unmapped_color.rgb ) ),
            min( 1f, linear_unmapped_color.a )
          );
        }
        default: {
          output_color = vec4( 1f, 0.5f, 0.111111, 1f );
        }
      }
    }
    textureStore( output, vec2( pixel_xy.x, pixel_xy.y ), premultiply( output_color ) );
  }
}
fn accumulate_box(
  accumulation: ptr<function, vec4<f32>>,
  min: vec2f,
  max: vec2f,
  bounds_centroid: vec2f,
  render_program_index: u32,
  is_full_area: bool,
  needs_centroid: bool
) {
  var area: f32;
  var centroid: vec2f;
  let max_area = ( max.x - min.x ) * ( max.y - min.y );
  if ( is_full_area ) {
    area = max_area;
    centroid = bounds_centroid;
  }
  else {
    initialize_box_partials( &area, &centroid, current_face.clip_counts, needs_centroid, min, max, bounds_centroid );
    for ( var edge_offset = 0u; edge_offset < current_face.num_edges; edge_offset++ ) {
      let linear_edge = edges[ current_face.edges_index + edge_offset ];
      add_clipped_box_partials( &area, &centroid, linear_edge, needs_centroid, min, max, bounds_centroid );
    }
    finalize_box_partials( &area, &centroid, needs_centroid );
  }
  if ( area > max_area * low_area_multiplier ) {
    let color = evaluate_render_program_instructions(
      render_program_index,
      centroid,
      bounds_centroid
    );
    *accumulation += color * area / max_area;
  }
}
fn initialize_box_partials(
  area_partial: ptr<function, f32>,
  centroid_partial: ptr<function, vec2<f32>>,
  packed_clip_counts: u32,
  needs_centroid: bool,
  min: vec2f,
  max: vec2f,
  bounds_centroid: vec2f,
) {
  let clip_counts = vec4f( unpack4xI8( packed_clip_counts ) );
  *area_partial = 2f * ( max.y - min.y ) * ( clip_counts.x * min.x + clip_counts.z * max.x );
  if ( needs_centroid ) {
    *centroid_partial = 6f * bounds_centroid * vec2(
      ( min.x - max.x ) * ( clip_counts.y * min.y + clip_counts.w * max.y ),
      ( max.y - min.y ) * ( clip_counts.x * min.x + clip_counts.z * max.x )
    );
  }
}
fn add_box_partial(
  area_partial: ptr<function, f32>,
  centroid_partial: ptr<function, vec2<f32>>,
  edge: LinearEdge,
  needs_centroid: bool
) {
  let p0 = edge.startPoint;
  let p1 = edge.endPoint;
  *area_partial += ( p1.x + p0.x ) * ( p1.y - p0.y );
  if ( needs_centroid ) {
    let base = p0.x * ( 2f * p0.y + p1.y ) + p1.x * ( p0.y + 2f * p1.y );
    *centroid_partial += base * vec2( p0.x - p1.x, p1.y - p0.y );
  }
}
fn add_scaled_box_partial(
  area_partial: ptr<function, f32>,
  centroid_partial: ptr<function, vec2<f32>>,
  edge: LinearEdge,
  needs_centroid: bool,
  scale: f32
) {
  let p0 = edge.startPoint;
  let p1 = edge.endPoint;
  *area_partial += scale * ( p1.x + p0.x ) * ( p1.y - p0.y );
  if ( needs_centroid ) {
    let base = scale * ( p0.x * ( 2f * p0.y + p1.y ) + p1.x * ( p0.y + 2f * p1.y ) );
    *centroid_partial += base * vec2( p0.x - p1.x, p1.y - p0.y );
  }
}
fn add_clipped_box_partials(
  area_partial: ptr<function, f32>,
  centroid_partial: ptr<function, vec2<f32>>,
  edge: LinearEdge,
  needs_centroid: bool,
  min: vec2f,
  max: vec2f,
  bounds_centroid: vec2f,
) {
  let result = bounds_clip_edge( edge, min.x, min.y, max.x, max.y, bounds_centroid.x, bounds_centroid.y );
  for ( var i = 0u; i < result.count; i++ ) {
    add_box_partial( area_partial, centroid_partial, result.edges[ i ], needs_centroid );
  }
}
fn finalize_box_partials(
  area_partial: ptr<function, f32>,
  centroid_partial: ptr<function, vec2<f32>>,
  needs_centroid: bool
) {
  *area_partial *= 0.5f;
  if ( needs_centroid && *area_partial > 1e-5 ) {
    *centroid_partial /= 6f * *area_partial;
  }
}
fn accumulate_grid_bilinear(
  accumulation: ptr<function, vec4<f32>>,
  min: vec2f,
  max: vec2f,
  local_index: vec3u,
  render_program_index: u32,
  is_full_area: bool,
  needs_centroid: bool
) {
  var integrals: array<f32, 4>;
  var centroid: vec2f;
  var bounds_centroid = vec2f( min + max ) * 0.5f;
  if ( is_full_area ) {
    integrals = array( 0.25f, 0.25f, 0.25f, 0.25f );
    if ( needs_centroid ) {
      centroid = bounds_centroid;
    }
  }
  else {
    integrals = array( 0f, 0f, 0f, 0f );
    var area: f32 = 0f;
    {
      if ( needs_centroid ) {
        initialize_box_partials( &area, &centroid, current_face.clip_counts, needs_centroid, min, max, bounds_centroid );
      }
      initialize_bilinear_partial(
        &area, &integrals[ 0 ], &centroid, current_face.clip_counts, min, 1f, 1f,
        min, max, false
      );
      initialize_bilinear_partial(
        &area, &integrals[ 1 ], &centroid, current_face.clip_counts, vec2( min.x, max.y ), -1f, 1f,
        min, max, false
      );
      initialize_bilinear_partial(
        &area, &integrals[ 2 ], &centroid, current_face.clip_counts, vec2( max.x, min.y ), -1f, 1f,
        min, max, false
      );
      initialize_bilinear_partial(
        &area, &integrals[ 3 ], &centroid, current_face.clip_counts, max, 1f, 1f,
        min, max, false
      );
    }
    for ( var edge_offset = 0u; edge_offset < current_face.num_edges; edge_offset++ ) {
      let linear_edge = edges[ current_face.edges_index + edge_offset ];
      let result = bounds_clip_edge( linear_edge, min.x, min.y, max.x, max.y, bounds_centroid.x, bounds_centroid.y );
      for ( var i = 0u; i < result.count; i++ ) {
        let edge = result.edges[ i ];
        if ( needs_centroid ) {
          add_box_partial( &area, &centroid, edge, needs_centroid );
        }
        add_bilinear_partial( &area, &integrals[ 0 ], &centroid, edge, false, min, 1f, 1f, 1f );
        add_bilinear_partial( &area, &integrals[ 1 ], &centroid, edge, false, vec2( min.x, max.y ), -1f, 1f, 1f );
        add_bilinear_partial( &area, &integrals[ 2 ], &centroid, edge, false, vec2( max.x, min.y ), -1f, 1f, 1f );
        add_bilinear_partial( &area, &integrals[ 3 ], &centroid, edge, false, max, 1f, 1f, 1f );
      }
    }
    if ( needs_centroid ) {
      finalize_box_partials( &area, &centroid, needs_centroid );
    }
  }
  shared_integrals[ local_index.x * 4u + 0u ] = integrals[ 0 ];
  shared_integrals[ local_index.x * 4u + 1u ] = integrals[ 1 ];
  shared_integrals[ local_index.x * 4u + 2u ] = integrals[ 2 ];
  shared_integrals[ local_index.x * 4u + 3u ] = integrals[ 3 ];
  let has_nonzero =
  integrals[ 0 ] > low_area_multiplier ||
  integrals[ 1 ] > low_area_multiplier ||
  integrals[ 2 ] > low_area_multiplier ||
  integrals[ 3 ] > low_area_multiplier;
  shared_colors[ local_index.x ] = select( vec4( 0f ), evaluate_render_program_instructions(
    render_program_index,
    centroid,
    bounds_centroid
  ), has_nonzero );
  workgroupBarrier();
  let local_coords = vec2( local_index.x % 16u, local_index.x / 16u );
  if ( local_coords.x < 15u && local_coords.y < 15u ) {
    {
      let index = 16u * local_coords.y + local_coords.x;
      *accumulation += shared_colors[ index ] * shared_integrals[ index * 4u + 3u ];
    }
    {
      let index = 16u * local_coords.y + local_coords.x + 1u;
      *accumulation += shared_colors[ index ] * shared_integrals[ index * 4u + 1u ];
    }
    {
      let index = 16u * ( local_coords.y + 1u ) + local_coords.x;
      *accumulation += shared_colors[ index ] * shared_integrals[ index * 4u + 2u ];
    }
    {
      let index = 16u * ( local_coords.y + 1u ) + local_coords.x + 1u;
      *accumulation += shared_colors[ index ] * shared_integrals[ index * 4u + 0u ];
    }
  }
}
fn accumulate_bilinear(
  accumulation: ptr<function, vec4<f32>>,
  min: vec2f,
  mid: vec2f,
  max: vec2f,
  render_program_index: u32,
  is_full_area: bool,
  needs_centroid: bool
) {
  var integrals: array<f32, 4>;
  var centroids: array<vec2f, 4>;
  let scale = mid.y - min.y;
  let low = 0.5f * ( min + mid );
  let high = 0.5f * ( mid + max );
  let low_high = vec2( low.x, high.y );
  let high_low = vec2( high.x, low.y );
  if ( is_full_area ) {
    integrals = array( 0.25f, 0.25f, 0.25f, 0.25f );
    centroids = array( low, low_high, high_low, high );
  }
  else {
    var areas: array<f32, 4> = array( 0f, 0f, 0f, 0f );
    integrals = array( 0f, 0f, 0f, 0f );
    centroids = array( vec2( 0f ), vec2f( 0f ), vec2f( 0f ), vec2f( 0f ) );
    {
      initialize_bilinear_partial(
        &areas[ 0 ], &integrals[ 0 ], &centroids[ 0 ], current_face.clip_counts, mid, 1f, scale,
        min, mid, needs_centroid
      );
      initialize_bilinear_partial(
        &areas[ 1 ], &integrals[ 1 ], &centroids[ 1 ], current_face.clip_counts, mid, -1f, scale,
        vec2( min.x, mid.y ), vec2( mid.x, max.y ), needs_centroid
      );
      initialize_bilinear_partial(
        &areas[ 2 ], &integrals[ 2 ], &centroids[ 2 ], current_face.clip_counts, mid, -1f, scale,
        vec2( mid.x, min.y ), vec2( max.x, mid.y ), needs_centroid
      );
      initialize_bilinear_partial(
        &areas[ 3 ], &integrals[ 3 ], &centroids[ 3 ], current_face.clip_counts, mid, 1f, scale,
        mid, max, needs_centroid
      );
    }
    for ( var edge_offset = 0u; edge_offset < current_face.num_edges; edge_offset++ ) {
      let linear_edge = edges[ current_face.edges_index + edge_offset ];
      {
        let result = bounds_clip_edge( linear_edge, min.x, min.y, mid.x, mid.y, low.x, low.y );
        for ( var i = 0u; i < result.count; i++ ) {
          add_bilinear_partial( &areas[ 0 ], &integrals[ 0 ], &centroids[ 0 ], result.edges[ i ], needs_centroid, mid, 1f, scale, 1f );
        }
      }
      {
        let result = bounds_clip_edge( linear_edge, min.x, mid.y, mid.x, max.y, low_high.x, low_high.y );
        for ( var i = 0u; i < result.count; i++ ) {
          add_bilinear_partial( &areas[ 1 ], &integrals[ 1 ], &centroids[ 1 ], result.edges[ i ], needs_centroid, mid, -1f, scale, 1f );
        }
      }
      {
        let result = bounds_clip_edge( linear_edge, mid.x, min.y, max.x, mid.y, high_low.x, high_low.y );
        for ( var i = 0u; i < result.count; i++ ) {
          add_bilinear_partial( &areas[ 2 ], &integrals[ 2 ], &centroids[ 2 ], result.edges[ i ], needs_centroid, mid, -1f, scale, 1f );
        }
      }
      {
        let result = bounds_clip_edge( linear_edge, mid.x, mid.y, max.x, max.y, high.x, high.y );
        for ( var i = 0u; i < result.count; i++ ) {
          add_bilinear_partial( &areas[ 3 ], &integrals[ 3 ], &centroids[ 3 ], result.edges[ i ], needs_centroid, mid, 1f, scale, 1f );
        }
      }
    }
    if ( needs_centroid ) {
      finalize_box_partials( &areas[ 0 ], &centroids[ 0 ], needs_centroid );
      finalize_box_partials( &areas[ 1 ], &centroids[ 1 ], needs_centroid );
      finalize_box_partials( &areas[ 2 ], &centroids[ 2 ], needs_centroid );
      finalize_box_partials( &areas[ 3 ], &centroids[ 3 ], needs_centroid );
    }
  }
  if ( integrals[ 0 ] > low_area_multiplier ) {
    let color = evaluate_render_program_instructions(
      render_program_index,
      centroids[ 0 ],
      low
    );
    *accumulation += color * integrals[ 0 ];
  }
  if ( integrals[ 1 ] > low_area_multiplier ) {
    let color = evaluate_render_program_instructions(
      render_program_index,
      centroids[ 1 ],
      low_high
    );
    *accumulation += color * integrals[ 1 ];
  }
  if ( integrals[ 2 ] > low_area_multiplier ) {
    let color = evaluate_render_program_instructions(
      render_program_index,
      centroids[ 2 ],
      high_low
    );
    *accumulation += color * integrals[ 2 ];
  }
  if ( integrals[ 3 ] > low_area_multiplier ) {
    let color = evaluate_render_program_instructions(
      render_program_index,
      centroids[ 3 ],
      high
    );
    *accumulation += color * integrals[ 3 ];
  }
}
fn initialize_bilinear_partial(
  area_partial: ptr<function, f32>,
  integral: ptr<function, f32>,
  centroid_partial: ptr<function, vec2<f32>>,
  packed_clip_counts: u32,
  offset: vec2f,
  sign_multiplier: f32,
  scale: f32,
  min: vec2f,
  max: vec2f,
  needs_centroid: bool
) {
  let clip_counts = vec4f( unpack4xI8( packed_clip_counts ) );
  if ( clip_counts[ 0 ] != 0f ) {
    add_bilinear_partial( area_partial, integral, centroid_partial, LinearEdge(
      min, vec2( min.x, max.y )
    ), needs_centroid, offset, sign_multiplier, scale, clip_counts[ 0 ] );
  }
  if ( clip_counts[ 1 ] != 0f ) {
    add_bilinear_partial( area_partial, integral, centroid_partial, LinearEdge(
      min, vec2( max.x, min.y )
    ), needs_centroid, offset, sign_multiplier, scale, clip_counts[ 1 ] );
  }
  if ( clip_counts[ 2 ] != 0f ) {
    add_bilinear_partial( area_partial, integral, centroid_partial, LinearEdge(
      vec2( max.x, min.y ), max
    ), needs_centroid, offset, sign_multiplier, scale, clip_counts[ 2 ] );
  }
  if ( clip_counts[ 3 ] != 0f ) {
    add_bilinear_partial( area_partial, integral, centroid_partial, LinearEdge(
      vec2( min.x, max.y ), max
    ), needs_centroid, offset, sign_multiplier, scale, clip_counts[ 3 ] );
  }
}
fn add_bilinear_partial(
  area_partial: ptr<function, f32>,
  integral: ptr<function, f32>,
  centroid_partial: ptr<function, vec2<f32>>,
  edge: LinearEdge,
  needs_centroid: bool,
  offset: vec2f,
  sign_multiplier: f32,
  scale: f32,
  output_scale: f32
) {
  if ( needs_centroid ) {
    add_scaled_box_partial( area_partial, centroid_partial, edge, needs_centroid, output_scale );
  }
  let p0 = abs( edge.startPoint - offset ) / vec2( scale );
  let p1 = abs( edge.endPoint - offset ) / vec2( scale );
  let c01 = p0.x * p1.y;
  let c10 = p1.x * p0.y;
  let raw = ( c01 - c10 ) * ( 12f - 4f * ( p0.x + p0.y + p1.x + p1.y ) + 2f * ( p0.x * p0.y + p1.x * p1.y ) + c10 + c01 ) / 24f;
  *integral += sign_multiplier * raw * output_scale;
}
fn evaluate_render_program_instructions(
  render_program_index: u32,
  centroid: vec2f,
  bounds_centroid: vec2f
) -> vec4f {
  var stack: array<vec4f,10>;
  var instruction_stack: array<u32,8>;
  var stack_length = 0u;
  var instruction_stack_length = 0u;
  var instruction_address = render_program_index;
  var is_done = false;
  var oops_count = 0u;
  while ( !is_done ) {
    oops_count++;
    if ( oops_count > 0xfffu ) {
      return oops_inifinite_loop_code;
    }
    let start_address = instruction_address;
    let instruction_u32 = render_program_instructions[ instruction_address ];
    let code = ( instruction_u32 & 0xffu );
    var instruction_length: u32;
    if ( ( code >> 4u ) == 0u ) {
      instruction_length = 1u;
    }
    else if ( ( code & 0xc0u ) != 0u ) {
      instruction_length = ( code & 0x1fu ) + 2u * ( instruction_u32 >> 16u );
    }
    else {
      instruction_length = ( code & 0x1fu );
    }
    instruction_address += instruction_length;
    switch ( code ) {
      case 0u: {
        is_done = true;
      }
      case 1u: {
        instruction_stack_length--;
        instruction_address = instruction_stack[ instruction_stack_length ];
      }
      case 133u: {
        stack[ stack_length ] = bitcast<vec4<f32>>( vec4(
          render_program_instructions[ start_address + 1u ],
          render_program_instructions[ start_address + 2u ],
          render_program_instructions[ start_address + 3u ],
          render_program_instructions[ start_address + 4u ]
        ) );
        stack_length++;
      }
      case 2u: {
        let background = stack[ stack_length - 1u ];
        let foreground = stack[ stack_length - 2u ];
        stack_length--;
        stack[ stack_length - 1u ] = ( 1f - foreground.a ) * background + foreground;
      }
      case 3u: {
        let zero_color = stack[ stack_length - 1u ];
        let one_color = stack[ stack_length - 2u ];
        let t = stack[ stack_length - 3u ].x;
        stack_length -= 2u;
        if ( t <= 0f || t >= 1f ) {
          stack[ stack_length - 1u ] = zero_color;
        }
        else {
          let minus_t = 1f - t;
          stack[ stack_length - 1u ] = zero_color * minus_t + one_color * t;
        }
      }
      case 5u: {
        let offset = instruction_u32 >> 8u;
        let color = stack[ stack_length - 1u ];
        if ( color.a >= 0.99999f ) {
          instruction_address = start_address + offset;
        }
      }
      case 14u: {
        stack[ stack_length - 1u ] = normalize( stack[ stack_length - 1u ] );
      }
      case 6u: {
        stack[ stack_length - 1u ] = premultiply( stack[ stack_length - 1u ] );
      }
      case 7u: {
        stack[ stack_length - 1u ] = unpremultiply( stack[ stack_length - 1u ] );
      }
      case 8u: {
        let color = stack[ stack_length - 1u ];
        stack[ stack_length - 1u ] = vec4( sRGB_to_linear_sRGB( color.rgb ), color.a );
      }
      case 9u: {
        let color = stack[ stack_length - 1u ];
        stack[ stack_length - 1u ] = vec4( linear_sRGB_to_sRGB( color.rgb ), color.a );
      }
      case 10u: {
        let color = stack[ stack_length - 1u ];
        stack[ stack_length - 1u ] = vec4( linear_displayP3_to_linear_sRGB( color.rgb ), color.a );
      }
      case 11u: {
        let color = stack[ stack_length - 1u ];
        stack[ stack_length - 1u ] = vec4( linear_sRGB_to_linear_displayP3( color.rgb ), color.a );
      }
      case 12u: {
        let color = stack[ stack_length - 1u ];
        stack[ stack_length - 1u ] = vec4( oklab_to_linear_sRGB( color.rgb ), color.a );
      }
      case 13u: {
        let color = stack[ stack_length - 1u ];
        stack[ stack_length - 1u ] = vec4( linear_sRGB_to_oklab( color.rgb ), color.a );
      }
      case 15u: {
        let normal = stack[ stack_length - 1u ];
        stack[ stack_length - 1u ] = vec4( normal.rgb * 0.5f + 0.5f, 1f );
      }
      case 4u: {
        let color_a = stack[ stack_length - 1u ];
        let color_b = stack[ stack_length - 2u ];
        let compose_type = ( instruction_u32 >> 8u ) & 0x7u;
        let blend_type = ( instruction_u32 >> 11u ) & 0xfu;
        stack_length--;
        stack[ stack_length - 1u ] = blend_compose( color_a, color_b, compose_type, blend_type );
      }
      case 130u: {
        let factor = bitcast<f32>( render_program_instructions[ start_address + 1u ] );
        stack[ stack_length - 1u ] = factor * stack[ stack_length - 1u ];
      }
      case 135u, 140u: {
        var t: f32;
        let accuracy = instruction_u32 >> 8u;
        let zero_offset = render_program_instructions[ start_address + 1u ];
        let one_offset = render_program_instructions[ start_address + 2u ];
        let blend_offset = render_program_instructions[ start_address + 3u ];
        if ( code == 135u ) {
          let scaled_normal = bitcast<vec2<f32>>( vec2(
            render_program_instructions[ start_address + 4u ],
            render_program_instructions[ start_address + 5u ]
          ) );
          let offset = bitcast<f32>( render_program_instructions[ start_address + 6u ] );
          let selected_centroid = select( bounds_centroid, centroid, accuracy == 0u );
          let dot_product = dot( scaled_normal, selected_centroid );
          t = dot_product - offset;
        }
        else {
          let inverse_transform = mat3x3(
            bitcast<f32>( render_program_instructions[ start_address + 4u ] ),
            bitcast<f32>( render_program_instructions[ start_address + 7u ] ),
            0f,
            bitcast<f32>( render_program_instructions[ start_address + 5u ] ),
            bitcast<f32>( render_program_instructions[ start_address + 8u ] ),
            0f,
            bitcast<f32>( render_program_instructions[ start_address + 6u ] ),
            bitcast<f32>( render_program_instructions[ start_address + 9u ] ),
            1f
          );
          let radius0 = bitcast<f32>( render_program_instructions[ start_address + 10u ] );
          let radius1 = bitcast<f32>( render_program_instructions[ start_address + 11u ] );
          var average_distance: f32;
          if ( accuracy == 0u ) {
            let localPoint = inverse_transform * vec3( centroid, 1f );
            average_distance = length( localPoint.xy );
          }
          else {
            let selected_centroid = select( bounds_centroid, centroid, accuracy == 1u );
            let localPoint = inverse_transform * vec3( selected_centroid, 1f );
            average_distance = length( localPoint.xy );
          }
          t = ( average_distance - radius0 ) / ( radius1 - radius0 );
        }
        stack[ stack_length ] = vec4( t, 0f, 0f, 0f );
        stack_length++;
        instruction_address = start_address + blend_offset;
        let has_zero = t < 1f;
        let has_one = t > 0f;
        if ( !has_zero || !has_one ) {
          stack_length++;
        }
        if ( has_zero ) {
          instruction_stack[ instruction_stack_length ] = instruction_address;
          instruction_stack_length++;
          instruction_address = start_address + zero_offset;
        }
        if ( has_one ) {
          instruction_stack[ instruction_stack_length ] = instruction_address;
          instruction_stack_length++;
          instruction_address = start_address + one_offset;
        }
      }
      case 204u, 202u: {
        let is_linear = code == 204u;
        let accuracy = ( instruction_u32 >> 8u ) & 0x7u;
        let extend = ( instruction_u32 >> 11u ) & 0x2u;
        let ratio_count = instruction_u32 >> 16u;
        let transform = mat3x3(
          bitcast<f32>( render_program_instructions[ start_address + 1u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 4u ] ),
          0f,
          bitcast<f32>( render_program_instructions[ start_address + 2u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 5u ] ),
          0f,
          bitcast<f32>( render_program_instructions[ start_address + 3u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 6u ] ),
          1f
        );
        var t: f32;
        if ( is_linear ) {
          let inverse_transform = transform;
          let start = bitcast<vec2<f32>>( vec2(
            render_program_instructions[ start_address + 7u ],
            render_program_instructions[ start_address + 8u ]
          ) );
          let grad_delta = bitcast<vec2<f32>>( vec2(
            render_program_instructions[ start_address + 9u ],
            render_program_instructions[ start_address + 10u ]
          ) );
          let selected_centroid = select( bounds_centroid, centroid, accuracy == 0u || accuracy == 2u );
          let local_point = ( inverse_transform * vec3( selected_centroid, 1f ) ).xy;
          let local_delta = local_point - start;
          let raw_t = select( 0f, dot( local_delta, grad_delta ) / dot( grad_delta, grad_delta ), length( grad_delta ) > 0f, );
          t = extend_f32( raw_t, extend );
        }
        else {
          let kind = ( instruction_u32 >> 13u ) & 0x3u;
          let is_swapped = ( ( instruction_u32 >> 15u ) % 0x1u ) != 0u;
          let conic_transform = transform;
          let focal_x = bitcast<f32>( render_program_instructions[ start_address + 7u ] );
          let radius = bitcast<f32>( render_program_instructions[ start_address + 8u ] );
          let is_strip = kind == 1u;
          let is_circular = kind == 0u;
          let is_focal_on_circle = kind == 2u;
          let r1_recip = select( 1.f / radius, 0f, is_circular );
          let less_scale = select( 1f, -1f, is_swapped || ( 1f - focal_x ) < 0f );
          let t_sign = sign( 1f - focal_x );
          let selected_centroid = select( bounds_centroid, centroid, accuracy == 0u || accuracy == 1u || accuracy == 3u );
          let point = selected_centroid;
          let local_xy = ( conic_transform * vec3( point, 1f ) ).xy;
          let x = local_xy.x;
          let y = local_xy.y;
          let xx = x * x;
          let yy = y * y;
          var is_valid = true;
          if ( is_strip ) {
            let a = radius - yy;
            t = sqrt( a ) + x;
            is_valid = a >= 0f;
          }
          else if ( is_focal_on_circle ) {
            t = ( xx + yy ) / x;
            is_valid = t >= 0f && x != 0f;
          }
          else if ( radius > 1f ) {
            t = sqrt( xx + yy ) - x * r1_recip;
          }
          else {
            let a = xx - yy;
            t = less_scale * sqrt( a ) - x * r1_recip;
            is_valid = a >= 0f && t >= 0f;
          }
          if ( is_valid ) {
            t = extend_f32( focal_x + t_sign * t, extend );
            if ( is_swapped ) {
              t = 1f - t;
            }
          }
        }
        let blend_offset = select( 9u, 11u, is_linear );
        let stops_offset = blend_offset + 1u;
        let blend_address = start_address + render_program_instructions[ start_address + blend_offset ];
        var i = -1i;
        while (
          i < i32( ratio_count ) - 1i &&
          bitcast<f32>( render_program_instructions[ start_address + stops_offset + 2u * u32( i + 1i ) ] ) < t
        ) {
          oops_count++;
          if ( oops_count > 0xfffu ) {
            return oops_inifinite_loop_code;
          }
          i++;
        }
        instruction_address = blend_address;
        if ( i == -1i ) {
          stack[ stack_length ] = vec4( 0f, 0f, 0f, 0f );
          stack[ stack_length + 1u ] = vec4( 0f, 0f, 0f, 0f );
          stack_length += 2;
          instruction_stack[ instruction_stack_length ] = instruction_address;
          instruction_stack_length++;
          instruction_address = start_address + render_program_instructions[ start_address + stops_offset + 1u ];
        }
        else if ( i == i32( ratio_count ) - 1i ) {
          stack[ stack_length ] = vec4( 1f, 0f, 0f, 0f );
          stack[ stack_length + 1u ] = vec4( 0f, 0f, 0f, 0f );
          stack_length += 2;
          instruction_stack[ instruction_stack_length ] = instruction_address;
          instruction_stack_length++;
          instruction_address = start_address + render_program_instructions[ start_address + stops_offset + 2u * u32( i ) + 1u ];
        }
        else {
          let ratio_before = bitcast<f32>( render_program_instructions[ start_address + stops_offset + 2u * u32( i ) ] );
          let ratio_after = bitcast<f32>( render_program_instructions[ start_address + stops_offset + 2u * u32( i + 1i ) ] );
          let ratio = ( t - ratio_before ) / ( ratio_after - ratio_before );
          stack[ stack_length ] = vec4( ratio, 0f, 0f, 0f );
          stack_length++;
          let hasBefore = ratio < 1f;
          let hasAfter = ratio > 0f;
          if ( !hasBefore || !hasAfter ) {
            stack[ stack_length ] = vec4( 0f, 0f, 0f, 0f );
            stack_length++;
          }
          if ( hasBefore ) {
            instruction_stack[ instruction_stack_length ] = instruction_address;
            instruction_stack_length++;
            instruction_address = start_address + render_program_instructions[ start_address + stops_offset + 2u * u32( i ) + 1u ];
          }
          if ( hasAfter ) {
            instruction_stack[ instruction_stack_length ] = instruction_address;
            instruction_stack_length++;
            instruction_address = start_address + render_program_instructions[ start_address + stops_offset + 2u * u32( i + 1i ) + 1u ];
          }
        }
      }
      case 136u, 139u: {
        let accuracy = instruction_u32 >> 8u;
        let det = bitcast<f32>( render_program_instructions[ start_address + 1u ] );
        let diff_a = bitcast<vec2<f32>>( vec2(
          render_program_instructions[ start_address + 2u ],
          render_program_instructions[ start_address + 3u ]
        ) );
        let diff_b = bitcast<vec2<f32>>( vec2(
          render_program_instructions[ start_address + 4u ],
          render_program_instructions[ start_address + 5u ]
        ) );
        let point_c = bitcast<vec2<f32>>( vec2(
          render_program_instructions[ start_address + 6u ],
          render_program_instructions[ start_address + 7u ]
        ) );
        let color_a = stack[ stack_length - 1u ];
        let color_b = stack[ stack_length - 2u ];
        let color_c = stack[ stack_length - 3u ];
        stack_length -= 2u;
        let point = select( bounds_centroid, centroid, accuracy == 0u );
        let lambda_a = dot( diff_a, point - point_c ) / det;
        let lambda_b = dot( diff_b, point - point_c ) / det;
        let lambda_c = 1f - lambda_a - lambda_b;
        if ( code == 136u ) {
          stack[ stack_length - 1u ] = color_a * lambda_a + color_b * lambda_b + color_c * lambda_c;
        }
        else {
          let z_inverse_a = lambda_a * bitcast<f32>( render_program_instructions[ start_address + 8u ] );
          let z_inverse_b = lambda_b * bitcast<f32>( render_program_instructions[ start_address + 9u ] );
          let z_inverse_c = lambda_c * bitcast<f32>( render_program_instructions[ start_address + 10u ] );
          stack[ stack_length - 1u ] = (
            color_a * z_inverse_a +
            color_b * z_inverse_b +
            color_c * z_inverse_c
          ) / ( z_inverse_a + z_inverse_b + z_inverse_c );
        }
      }
      case 149u: {
        let matrix = transpose( mat4x4(
          bitcast<f32>( render_program_instructions[ start_address + 1u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 2u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 3u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 4u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 5u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 6u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 7u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 8u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 9u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 10u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 11u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 12u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 13u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 14u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 15u ] ),
          bitcast<f32>( render_program_instructions[ start_address + 16u ] )
        ) );
        let translation = bitcast<vec4<f32>>( vec4(
          render_program_instructions[ start_address + 17u ],
          render_program_instructions[ start_address + 18u ],
          render_program_instructions[ start_address + 19u ],
          render_program_instructions[ start_address + 20u ]
        ) );
        stack[ stack_length - 1u ] = matrix * stack[ stack_length - 1u ] + translation;
      }
      case 131u: {
        let alpha = bitcast<f32>( render_program_instructions[ start_address + 1u ] );
        let num_lights = render_program_instructions[ start_address + 2u ];
        let ambient = stack[ stack_length - 1u ];
        let diffuse = stack[ stack_length - 2u ];
        let specular = stack[ stack_length - 3u ];
        let position = stack[ stack_length - 4u ];
        let normal = stack[ stack_length - 5u ];
        stack_length -= 4u;
        var output = ambient;
        let view_direction = normalize( -position );
        for ( var i = 0u; i < num_lights; i++ ) {
          oops_count++;
          if ( oops_count > 0xfffu ) {
            return oops_inifinite_loop_code;
          }
          let light_direction = stack[ stack_length - 2u ];
          let light_color = stack[ stack_length - 3u ];
          stack_length -= 2u;
          let dot_product = dot( normal, light_direction );
          if ( dot_product > 0f ) {
            let reflection = 2f * dot_product * normal - light_direction;
            let specular_amount = pow( abs( dot( reflection, view_direction ) ), alpha );
            output += light_color * (
              diffuse * vec4( vec3( dot_product ), 1f ) +
              specular * vec4( vec3( specular_amount ), 1f )
            );
          }
        }
        stack[ stack_length - 1u ] = clamp( output, vec4( 0f ), vec4( 1f ) );
      }
      default: {
        return vec4f( -1f, -1f, -1f, -1f );
      }
    }
  }
  return stack[ 0u ];
}
struct TwoPassConfig {
  raster_width: u32,
  raster_height: u32,
  tile_width: u32,
  tile_height: u32,
  bin_width: u32,
  bin_height: u32,
  tile_size: u32,
  bin_size: u32,
  filter_type: u32,
  filter_scale: f32,
  raster_color_space: u32
}
