-- Update Bob Circosta article to use the new image as the main image
UPDATE submissions 
SET image_urls = ARRAY[
  'https://scontent-mia3-2.xx.fbcdn.net/v/t39.30808-6/474125997_991822816300309_4926096617030738221_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=dE-HnpyB8GQQ7kNvwGEBLNb&_nc_oc=Adnqm4D2biSOEmdBlZREztl0PfG0B6aPIQpNQDgHF3H55UHo5NtMJiF4f2ctLs2b0bw&_nc_zt=23&_nc_ht=scontent-mia3-2.xx&_nc_gid=tPs-_y_dKxy6RPDifd6WiA&oh=00_AfTo48xmS4bumtKlWYvNBXYahmdafGLoxzedWN8Ojrpwiw&oe=68734663'
] || COALESCE(image_urls, ARRAY[]::text[])
WHERE full_name ILIKE '%Bob Circosta%';