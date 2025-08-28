-- First create fake user profiles for reviewers, then add reviews
DO $$
DECLARE
    product_record RECORD;
    review_count INTEGER;
    review_rating INTEGER;
    reviewer_names TEXT[] := ARRAY[
        'Sarah Johnson', 'Mike Chen', 'Emily Rodriguez', 'David Wilson', 'Jessica Taylor',
        'Ryan Smith', 'Amanda Brown', 'Chris Garcia', 'Lauren Davis', 'Kevin Martinez',
        'Nicole Thompson', 'Brandon Lee', 'Ashley White', 'Tyler Jackson', 'Megan Clark',
        'Justin Lewis', 'Rachel Walker', 'Daniel Hall', 'Stephanie Allen', 'Matthew Young',
        'Kimberly King', 'Anthony Wright', 'Jennifer Lopez', 'Joshua Hill', 'Michelle Green',
        'Andrew Adams', 'Lisa Baker', 'Steven Nelson', 'Rebecca Carter', 'William Mitchell'
    ];
    reviewer_emails TEXT[] := ARRAY[
        'sarah.johnson@example.com', 'mike.chen@example.com', 'emily.rodriguez@example.com', 
        'david.wilson@example.com', 'jessica.taylor@example.com', 'ryan.smith@example.com',
        'amanda.brown@example.com', 'chris.garcia@example.com', 'lauren.davis@example.com',
        'kevin.martinez@example.com', 'nicole.thompson@example.com', 'brandon.lee@example.com',
        'ashley.white@example.com', 'tyler.jackson@example.com', 'megan.clark@example.com',
        'justin.lewis@example.com', 'rachel.walker@example.com', 'daniel.hall@example.com',
        'stephanie.allen@example.com', 'matthew.young@example.com', 'kimberly.king@example.com',
        'anthony.wright@example.com', 'jennifer.lopez@example.com', 'joshua.hill@example.com',
        'michelle.green@example.com', 'andrew.adams@example.com', 'lisa.baker@example.com',
        'steven.nelson@example.com', 'rebecca.carter@example.com', 'william.mitchell@example.com'
    ];
    review_titles_5_star TEXT[] := ARRAY[
        'Amazing product!', 'Love it!', 'Perfect!', 'Exactly what I needed',
        'Outstanding quality', 'Highly recommend', 'Exceeded expectations',
        'Best purchase ever', 'Fantastic quality', 'Worth every penny',
        'Absolutely perfect', 'Five stars all the way', 'Incredible value',
        'Premium quality', 'Simply amazing', 'Top-notch product'
    ];
    review_titles_4_star TEXT[] := ARRAY[
        'Great product', 'Very satisfied', 'Good quality', 'Happy with purchase',
        'Solid choice', 'Meets expectations', 'Good value', 'Recommended',
        'Well made', 'Nice product', 'Pretty good', 'Works well',
        'Good buy', 'Satisfied customer', 'Quality item', 'Pleased with it'
    ];
    review_content_5_star TEXT[] := ARRAY[
        'This product has completely exceeded my expectations! The quality is outstanding and it works perfectly. I would definitely buy again and recommend to others.',
        'Absolutely love this! The build quality is excellent and it performs exactly as advertised. Worth every penny and more.',
        'Perfect in every way! Fast shipping, great packaging, and the product itself is fantastic. This has made my life so much easier.',
        'I am thrilled with this purchase! The quality is superb and it has been working flawlessly. Highly recommend to anyone considering it.',
        'Outstanding product! The attention to detail is remarkable and it has performed beyond my expectations. Five stars without hesitation.',
        'This is exactly what I was looking for! Great quality, perfect functionality, and excellent value. Could not be happier with my purchase.',
        'Incredible quality and performance! This product has been a game-changer for me. The craftsmanship is evident and it works beautifully.',
        'Simply amazing! The product arrived quickly and exceeded all my expectations. The quality is top-notch and I love using it every day.',
        'Best purchase I have made in a long time! The quality is exceptional and it has made such a difference. Highly recommend!',
        'Fantastic product with premium quality! Everything about it is perfect - from the design to the functionality. Absolutely love it!'
    ];
    review_content_4_star TEXT[] := ARRAY[
        'Really good product overall. The quality is solid and it works as expected. Would recommend to others looking for this type of product.',
        'Very satisfied with this purchase. Good quality construction and it performs well. A few minor things could be improved but overall great.',
        'Good product that meets my needs. The quality is decent and it has been working well. Happy with the purchase overall.',
        'Solid choice for the price. The quality is good and it functions as advertised. Would consider buying from this brand again.',
        'Happy with this purchase. Good build quality and it works reliably. A couple small issues but nothing major. Recommended.',
        'Nice product with good performance. The quality seems solid and it has been working without issues. Good value for the money.',
        'Pretty good product overall. The quality is acceptable and it does what it is supposed to do. Satisfied with the purchase.',
        'Good buy for the price. The product quality is decent and it has been reliable. Would recommend to others with similar needs.',
        'Well-made product that works as expected. Good quality materials and construction. A few areas for improvement but overall pleased.',
        'Satisfied with this product. Good quality and functionality. It has been working well and I would consider it a good purchase.'
    ];
    random_name TEXT;
    random_email TEXT;
    random_title TEXT;
    random_content TEXT;
    random_reviewer_id UUID;
    reviewer_ids UUID[];
BEGIN
    -- First create fake user profiles
    FOR i IN 1..array_length(reviewer_names, 1) LOOP
        random_reviewer_id := gen_random_uuid();
        reviewer_ids := array_append(reviewer_ids, random_reviewer_id);
        
        -- Insert into profiles table
        INSERT INTO profiles (id, email, full_name, created_at)
        VALUES (
            random_reviewer_id,
            reviewer_emails[i],
            reviewer_names[i],
            now() - (random() * interval '60 days')
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
    
    -- Now loop through each active marketplace product to add reviews
    FOR product_record IN 
        SELECT id FROM marketplace_products WHERE status = 'active'
    LOOP
        -- Generate 10-20 reviews per product
        review_count := 10 + floor(random() * 11)::INTEGER; -- Random between 10-20
        
        FOR i IN 1..review_count LOOP
            -- Randomly choose 4 or 5 star rating (80% chance of 5 stars, 20% chance of 4 stars)
            IF random() < 0.8 THEN
                review_rating := 5;
                random_title := review_titles_5_star[1 + floor(random() * array_length(review_titles_5_star, 1))];
                random_content := review_content_5_star[1 + floor(random() * array_length(review_content_5_star, 1))];
            ELSE
                review_rating := 4;
                random_title := review_titles_4_star[1 + floor(random() * array_length(review_titles_4_star, 1))];
                random_content := review_content_4_star[1 + floor(random() * array_length(review_content_4_star, 1))];
            END IF;
            
            -- Pick random reviewer from our created profiles
            random_reviewer_id := reviewer_ids[1 + floor(random() * array_length(reviewer_ids, 1))];
            
            -- Insert the review
            INSERT INTO marketplace_reviews (
                product_id,
                reviewer_id,
                rating,
                title,
                content,
                created_at
            ) VALUES (
                product_record.id,
                random_reviewer_id,
                review_rating,
                random_title,
                random_content,
                now() - (random() * interval '30 days') -- Random date within last 30 days
            );
        END LOOP;
    END LOOP;
END $$;