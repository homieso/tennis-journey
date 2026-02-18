import { supabase } from './src/lib/supabase.js';

async function testQuery() {
  console.log('Testing community posts query...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          gender,
          playing_years,
          self_rated_ntrp,
          idol,
          tennis_style,
          location,
          avatar_url
        ),
        scout_reports!posts_report_id_fkey (
          id,
          generated_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error:', error.message, error.code, error.details, error.hint);
    } else {
      console.log('Success, found', data.length, 'posts');
      console.log('First post:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testQuery();