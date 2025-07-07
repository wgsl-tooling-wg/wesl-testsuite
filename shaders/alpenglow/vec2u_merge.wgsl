@group(0) @binding(0)
var<storage, read> a: array<vec2u, 1300>;
@group(0) @binding(1)
var<storage, read> b: array<vec2u, 1000>;
@group(0) @binding(2)
var<storage, read_write> c: array<vec2u, 2300>;
var<workgroup> consumed_a: atomic<u32>;
var<workgroup> consumed_b: atomic<u32>;
var<workgroup> block_start_a: u32;
var<workgroup> block_end_a: u32;
var<workgroup> scratch_a: array<vec2u,128>;
var<workgroup> scratch_b: array<vec2u,128>;
@compute @workgroup_size(32)
fn main(
  @builtin(global_invocation_id) global_id: vec3u,
  @builtin(local_invocation_id) local_id: vec3u,
  @builtin(workgroup_id) workgroup_id: vec3u
) {
  /*** begin merge ***/
  {
    let max_output = 1300u + 1000u;
    let block_start_output = min( max_output, workgroup_id.x * 256u );
    let block_end_output = min( max_output, block_start_output + 256u );
    let block_length = block_end_output - block_start_output;
    if ( block_length > 0u ) {
      if ( local_id.x < 2u ) {
        let output_index = select( block_start_output, block_end_output, local_id.x == 1u );
        /*** begin get_corank ***/
        var block_a = min( output_index, 1300u );
        {
          var gc_j = output_index - block_a;
          var gc_i_low: u32 = select( output_index - 1000u, 0u, output_index <= 1000u );
          var gc_j_low = select( output_index - 1300u, 0u, output_index <= 1300u );
          var gc_delta: u32;
          var oops_count_corank = 0u;
          while ( true ) {
            oops_count_corank++;
            if ( oops_count_corank > 0xffu ) {
              break;
            }
            if ( block_a > 0u && gc_j < 1000u && ( a[ block_a - 1u ].x > b[ gc_j ].x || ( a[ block_a - 1u ].x == b[ gc_j ].x && a[ block_a - 1u ].y > b[ gc_j ].y ) ) ) {
              gc_delta = ( block_a - gc_i_low + 1u ) >> 1u;
              gc_j_low = gc_j;
              gc_j = gc_j + gc_delta;
              block_a = block_a - gc_delta;
            }
            else if ( gc_j > 0u && block_a < 1300u && ( a[ block_a ].x <= b[ gc_j - 1u ].x && ( a[ block_a ].x != b[ gc_j - 1u ].x || a[ block_a ].y <= b[ gc_j - 1u ].y ) ) ) {
              gc_delta = ( gc_j - gc_j_low + 1u ) >> 1u;
              gc_i_low = block_a;
              block_a = block_a + gc_delta;
              gc_j = gc_j - gc_delta;
            }
            else {
              break;
            }
          }
        }
        /*** end get_corank ***/
        if ( local_id.x == 0u ) {
          block_start_a = block_a;
        }
        else {
          block_end_a = block_a;
        }
      }
      workgroupBarrier();
      let block_start_b = block_start_output - block_start_a;
      let block_end_b = block_end_output - block_end_a;
      var processed_index_a = block_start_a;
      var processed_index_b = block_start_b;
      var loaded_index_a = block_start_a;
      var loaded_index_b = block_start_b;
      let total_iterations = ( block_length + 127u ) / 128u;
      var iteration = 0u;
      var oops_count_merge = 0u;
      while ( iteration < total_iterations ) {
        oops_count_merge++;
        if ( oops_count_merge > 0xffu ) {
          break;
        }
        let loading_a_quantity = min( min( block_end_a, processed_index_a + 128u ) - loaded_index_a, 128u );
        {
          let relative_index = local_id.x + 0u;
          if ( relative_index < loading_a_quantity ) {
            let index = relative_index + loaded_index_a;
            scratch_a[ index % 128u ] = a[ index ];
          }
        }
        {
          let relative_index = local_id.x + 32u;
          if ( relative_index < loading_a_quantity ) {
            let index = relative_index + loaded_index_a;
            scratch_a[ index % 128u ] = a[ index ];
          }
        }
        {
          let relative_index = local_id.x + 64u;
          if ( relative_index < loading_a_quantity ) {
            let index = relative_index + loaded_index_a;
            scratch_a[ index % 128u ] = a[ index ];
          }
        }
        {
          let relative_index = local_id.x + 96u;
          if ( relative_index < loading_a_quantity ) {
            let index = relative_index + loaded_index_a;
            scratch_a[ index % 128u ] = a[ index ];
          }
        }
        loaded_index_a += loading_a_quantity;
        let loading_b_quantity = min( min( block_end_b, processed_index_b + 128u ) - loaded_index_b, 128u );
        {
          let relative_index = local_id.x + 0u;
          if ( relative_index < loading_b_quantity ) {
            let index = relative_index + loaded_index_b;
            scratch_b[ index % 128u ] = b[ index ];
          }
        }
        {
          let relative_index = local_id.x + 32u;
          if ( relative_index < loading_b_quantity ) {
            let index = relative_index + loaded_index_b;
            scratch_b[ index % 128u ] = b[ index ];
          }
        }
        {
          let relative_index = local_id.x + 64u;
          if ( relative_index < loading_b_quantity ) {
            let index = relative_index + loaded_index_b;
            scratch_b[ index % 128u ] = b[ index ];
          }
        }
        {
          let relative_index = local_id.x + 96u;
          if ( relative_index < loading_b_quantity ) {
            let index = relative_index + loaded_index_b;
            scratch_b[ index % 128u ] = b[ index ];
          }
        }
        loaded_index_b += loading_b_quantity;
        if ( local_id.x == 0u ) {
          atomicStore( &consumed_a, 0u );
          atomicStore( &consumed_b, 0u );
        }
        workgroupBarrier();
        let base_iteration_index = block_start_output + iteration * 128u;
        let thread_start_output = min( block_end_output, base_iteration_index + local_id.x * 4u );
        let thread_end_output = min( block_end_output, base_iteration_index + ( local_id.x + 1 ) * 4u );
        let thread_length = thread_end_output - thread_start_output;
        if ( thread_length > 0u ) {
          let iteration_length_a = loaded_index_a - processed_index_a;
          let iteration_length_b = loaded_index_b - processed_index_b;
          let output_relative_start = thread_start_output - base_iteration_index;
          let output_relative_end = thread_end_output - base_iteration_index;
          /*** begin get_corank ***/
          var thread_relative_start_a = min( output_relative_start, iteration_length_a );
          {
            var gc_j = output_relative_start - thread_relative_start_a;
            var gc_i_low: u32 = select( output_relative_start - iteration_length_b, 0u, output_relative_start <= iteration_length_b );
            var gc_j_low = select( output_relative_start - iteration_length_a, 0u, output_relative_start <= iteration_length_a );
            var gc_delta: u32;
            var oops_count_corank = 0u;
            while ( true ) {
              oops_count_corank++;
              if ( oops_count_corank > 0xffu ) {
                break;
              }
              if ( thread_relative_start_a > 0u && gc_j < iteration_length_b && ( scratch_a[ ( thread_relative_start_a - 1u + processed_index_a ) % 128u ].x > scratch_b[ ( gc_j + processed_index_b ) % 128u ].x || ( scratch_a[ ( thread_relative_start_a - 1u + processed_index_a ) % 128u ].x == scratch_b[ ( gc_j + processed_index_b ) % 128u ].x && scratch_a[ ( thread_relative_start_a - 1u + processed_index_a ) % 128u ].y > scratch_b[ ( gc_j + processed_index_b ) % 128u ].y ) ) ) {
                gc_delta = ( thread_relative_start_a - gc_i_low + 1u ) >> 1u;
                gc_j_low = gc_j;
                gc_j = gc_j + gc_delta;
                thread_relative_start_a = thread_relative_start_a - gc_delta;
              }
              else if ( gc_j > 0u && thread_relative_start_a < iteration_length_a && ( scratch_a[ ( thread_relative_start_a + processed_index_a ) % 128u ].x <= scratch_b[ ( gc_j - 1u + processed_index_b ) % 128u ].x && ( scratch_a[ ( thread_relative_start_a + processed_index_a ) % 128u ].x != scratch_b[ ( gc_j - 1u + processed_index_b ) % 128u ].x || scratch_a[ ( thread_relative_start_a + processed_index_a ) % 128u ].y <= scratch_b[ ( gc_j - 1u + processed_index_b ) % 128u ].y ) ) ) {
                gc_delta = ( gc_j - gc_j_low + 1u ) >> 1u;
                gc_i_low = thread_relative_start_a;
                thread_relative_start_a = thread_relative_start_a + gc_delta;
                gc_j = gc_j - gc_delta;
              }
              else {
                break;
              }
            }
          }
          /*** end get_corank ***/
          /*** begin get_corank ***/
          var thread_relative_end_a = min( output_relative_end, iteration_length_a );
          {
            var gc_j = output_relative_end - thread_relative_end_a;
            var gc_i_low: u32 = select( output_relative_end - iteration_length_b, 0u, output_relative_end <= iteration_length_b );
            var gc_j_low = select( output_relative_end - iteration_length_a, 0u, output_relative_end <= iteration_length_a );
            var gc_delta: u32;
            var oops_count_corank = 0u;
            while ( true ) {
              oops_count_corank++;
              if ( oops_count_corank > 0xffu ) {
                break;
              }
              if ( thread_relative_end_a > 0u && gc_j < iteration_length_b && ( scratch_a[ ( thread_relative_end_a - 1u + processed_index_a ) % 128u ].x > scratch_b[ ( gc_j + processed_index_b ) % 128u ].x || ( scratch_a[ ( thread_relative_end_a - 1u + processed_index_a ) % 128u ].x == scratch_b[ ( gc_j + processed_index_b ) % 128u ].x && scratch_a[ ( thread_relative_end_a - 1u + processed_index_a ) % 128u ].y > scratch_b[ ( gc_j + processed_index_b ) % 128u ].y ) ) ) {
                gc_delta = ( thread_relative_end_a - gc_i_low + 1u ) >> 1u;
                gc_j_low = gc_j;
                gc_j = gc_j + gc_delta;
                thread_relative_end_a = thread_relative_end_a - gc_delta;
              }
              else if ( gc_j > 0u && thread_relative_end_a < iteration_length_a && ( scratch_a[ ( thread_relative_end_a + processed_index_a ) % 128u ].x <= scratch_b[ ( gc_j - 1u + processed_index_b ) % 128u ].x && ( scratch_a[ ( thread_relative_end_a + processed_index_a ) % 128u ].x != scratch_b[ ( gc_j - 1u + processed_index_b ) % 128u ].x || scratch_a[ ( thread_relative_end_a + processed_index_a ) % 128u ].y <= scratch_b[ ( gc_j - 1u + processed_index_b ) % 128u ].y ) ) ) {
                gc_delta = ( gc_j - gc_j_low + 1u ) >> 1u;
                gc_i_low = thread_relative_end_a;
                thread_relative_end_a = thread_relative_end_a + gc_delta;
                gc_j = gc_j - gc_delta;
              }
              else {
                break;
              }
            }
          }
          /*** end get_corank ***/
          let thread_relative_start_b = output_relative_start - thread_relative_start_a;
          let thread_relative_end_b = output_relative_end - thread_relative_end_a;
          let thread_length_a = thread_relative_end_a - thread_relative_start_a;
          let thread_length_b = thread_relative_end_b - thread_relative_start_b;
          atomicAdd( &consumed_a, thread_length_a );
          atomicAdd( &consumed_b, thread_length_b );
          /*** begin merge_sequential ***/
          {
            var ms_i = 0u;
            var ms_j = 0u;
            var ms_k = 0u;
            var oops_count = 0u;
            while ( ms_i < thread_length_a && ms_j < thread_length_b ) {
              oops_count++;
              if ( oops_count > 0xffu ) {
                break;
              }
              if ( select( select( select( select( 0i, 1i, scratch_a[ ( ms_i + processed_index_a + thread_relative_start_a ) % 128u ].y > scratch_b[ ( ms_j + processed_index_b + thread_relative_start_b ) % 128u ].y ), -1i, scratch_a[ ( ms_i + processed_index_a + thread_relative_start_a ) % 128u ].y < scratch_b[ ( ms_j + processed_index_b + thread_relative_start_b ) % 128u ].y ), 1i, scratch_a[ ( ms_i + processed_index_a + thread_relative_start_a ) % 128u ].x > scratch_b[ ( ms_j + processed_index_b + thread_relative_start_b ) % 128u ].x ), -1i, scratch_a[ ( ms_i + processed_index_a + thread_relative_start_a ) % 128u ].x < scratch_b[ ( ms_j + processed_index_b + thread_relative_start_b ) % 128u ].x ) <= 0i ) {
                c[ ( ms_k + thread_start_output ) ] = scratch_a[ ( ms_i + processed_index_a + thread_relative_start_a ) % 128u ];
                ms_i++;
              }
              else {
                c[ ( ms_k + thread_start_output ) ] = scratch_b[ ( ms_j + processed_index_b + thread_relative_start_b ) % 128u ];
                ms_j++;
              }
              ms_k++;
            }
            while ( ms_i < thread_length_a ) {
              oops_count++;
              if ( oops_count > 0xffu ) {
                break;
              }
              c[ ( ms_k + thread_start_output ) ] = scratch_a[ ( ms_i + processed_index_a + thread_relative_start_a ) % 128u ];
              ms_i++;
              ms_k++;
            }
            while ( ms_j < thread_length_b ) {
              oops_count++;
              if ( oops_count > 0xffu ) {
                break;
              }
              c[ ( ms_k + thread_start_output ) ] = scratch_b[ ( ms_j + processed_index_b + thread_relative_start_b ) % 128u ];
              ms_j++;
              ms_k++;
            }
          }
          /*** end merge_sequential ***/
        }
        workgroupBarrier();
        processed_index_a += atomicLoad( &consumed_a );
        processed_index_b += atomicLoad( &consumed_b );
        iteration++;
      }
    }
  }
  /*** end merge ***/
}
