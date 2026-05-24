require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || "YOUR_URL";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "YOUR_KEY";

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      author:users!community_posts_author_id_fkey(full_name, location, avatar_url),
      comments:post_comments(id),
      likes:post_likes(user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Query Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success! Data:', data);
  }
}

run();
