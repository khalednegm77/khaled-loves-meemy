/*
# Update closing content to romantic message without anniversary reference
*/

UPDATE site_content 
SET content = jsonb_build_object(
  'quote', 'In a sea of people, my eyes will always search for you.',
  'description', 'Thank you for every laugh, every hug, and every quiet moment in between. You are my favorite person, my best friend, and my greatest adventure. I love you more than words could ever say.',
  'signature', 'khaled & amyy',
  'tagline', 'Forever & always'
)
WHERE section = 'closing';