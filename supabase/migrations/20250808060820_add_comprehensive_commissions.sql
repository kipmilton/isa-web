-- Add comprehensive commission rates for all product categories
-- This migration adds commission rates for all categories and subcategories

-- Insert comprehensive commission rates for all categories
INSERT INTO public.vendor_commissions (main_category, subcategory, sub_subcategory, category_path, freemium_commission_rate, premium_commission_rate) VALUES
-- Electronics
('Electronics', 'Mobile Phones & Tablets', 'Smartphones', 'Electronics/Mobile Phones & Tablets/Smartphones', 8.0, 4.0),
('Electronics', 'Mobile Phones & Tablets', 'Feature Phones', 'Electronics/Mobile Phones & Tablets/Feature Phones', 8.0, 4.0),
('Electronics', 'Mobile Phones & Tablets', 'Tablets', 'Electronics/Mobile Phones & Tablets/Tablets', 8.0, 4.0),
('Electronics', 'Mobile Phones & Tablets', 'Phone Accessories', 'Electronics/Mobile Phones & Tablets/Phone Accessories', 10.0, 5.0),
('Electronics', 'Computers & Accessories', 'Laptops', 'Electronics/Computers & Accessories/Laptops', 7.0, 3.5),
('Electronics', 'Computers & Accessories', 'Desktops', 'Electronics/Computers & Accessories/Desktops', 7.0, 3.5),
('Electronics', 'Computers & Accessories', 'Monitors', 'Electronics/Computers & Accessories/Monitors', 8.0, 4.0),
('Electronics', 'Computers & Accessories', 'Keyboards & Mice', 'Electronics/Computers & Accessories/Keyboards & Mice', 10.0, 5.0),
('Electronics', 'Computers & Accessories', 'Printers & Scanners', 'Electronics/Computers & Accessories/Printers & Scanners', 8.0, 4.0),
('Electronics', 'Computers & Accessories', 'Computer Components', 'Electronics/Computers & Accessories/Computer Components', 8.0, 4.0),
('Electronics', 'TV, Audio & Video', 'Televisions', 'Electronics/TV, Audio & Video/Televisions', 6.0, 3.0),
('Electronics', 'TV, Audio & Video', 'Home Theaters', 'Electronics/TV, Audio & Video/Home Theaters', 8.0, 4.0),
('Electronics', 'TV, Audio & Video', 'Speakers', 'Electronics/TV, Audio & Video/Speakers', 10.0, 5.0),
('Electronics', 'TV, Audio & Video', 'Projectors', 'Electronics/TV, Audio & Video/Projectors', 7.0, 3.5),
('Electronics', 'TV, Audio & Video', 'Soundbars', 'Electronics/TV, Audio & Video/Soundbars', 8.0, 4.0),
('Electronics', 'Cameras & Accessories', 'Digital Cameras', 'Electronics/Cameras & Accessories/Digital Cameras', 8.0, 4.0),
('Electronics', 'Cameras & Accessories', 'DSLR & Mirrorless Cameras', 'Electronics/Cameras & Accessories/DSLR & Mirrorless Cameras', 7.0, 3.5),
('Electronics', 'Cameras & Accessories', 'Camera Lenses', 'Electronics/Cameras & Accessories/Camera Lenses', 8.0, 4.0),
('Electronics', 'Cameras & Accessories', 'Tripods & Stabilizers', 'Electronics/Cameras & Accessories/Tripods & Stabilizers', 10.0, 5.0),
('Electronics', 'Cameras & Accessories', 'Security Cameras', 'Electronics/Cameras & Accessories/Security Cameras', 8.0, 4.0),

-- Fashion
('Fashion', 'Women''s Fashion', 'Clothing', 'Fashion/Women''s Fashion/Clothing', 12.0, 6.0),
('Fashion', 'Women''s Fashion', 'Shoes', 'Fashion/Women''s Fashion/Shoes', 12.0, 6.0),
('Fashion', 'Women''s Fashion', 'Handbags & Wallets', 'Fashion/Women''s Fashion/Handbags & Wallets', 12.0, 6.0),
('Fashion', 'Women''s Fashion', 'Jewelry & Watches', 'Fashion/Women''s Fashion/Jewelry & Watches', 10.0, 5.0),
('Fashion', 'Women''s Fashion', 'Lingerie & Sleepwear', 'Fashion/Women''s Fashion/Lingerie & Sleepwear', 12.0, 6.0),
('Fashion', 'Men''s Fashion', 'Clothing', 'Fashion/Men''s Fashion/Clothing', 12.0, 6.0),
('Fashion', 'Men''s Fashion', 'Shoes', 'Fashion/Men''s Fashion/Shoes', 12.0, 6.0),
('Fashion', 'Men''s Fashion', 'Belts & Wallets', 'Fashion/Men''s Fashion/Belts & Wallets', 12.0, 6.0),
('Fashion', 'Men''s Fashion', 'Watches', 'Fashion/Men''s Fashion/Watches', 10.0, 5.0),
('Fashion', 'Kids & Baby Fashion', 'Girls'' Clothing', 'Fashion/Kids & Baby Fashion/Girls'' Clothing', 12.0, 6.0),
('Fashion', 'Kids & Baby Fashion', 'Boys'' Clothing', 'Fashion/Kids & Baby Fashion/Boys'' Clothing', 12.0, 6.0),
('Fashion', 'Kids & Baby Fashion', 'Baby Clothing', 'Fashion/Kids & Baby Fashion/Baby Clothing', 12.0, 6.0),
('Fashion', 'Kids & Baby Fashion', 'School Uniforms', 'Fashion/Kids & Baby Fashion/School Uniforms', 12.0, 6.0),
('Fashion', 'Kids & Baby Fashion', 'Shoes', 'Fashion/Kids & Baby Fashion/Shoes', 12.0, 6.0),

-- Swimwear
('Swimwear', 'Women''s Swimwear', 'One-Piece Swimsuits', 'Swimwear/Women''s Swimwear/One-Piece Swimsuits', 12.0, 6.0),
('Swimwear', 'Women''s Swimwear', 'Bikinis', 'Swimwear/Women''s Swimwear/Bikinis', 12.0, 6.0),
('Swimwear', 'Women''s Swimwear', 'Tankinis', 'Swimwear/Women''s Swimwear/Tankinis', 12.0, 6.0),
('Swimwear', 'Women''s Swimwear', 'Swim Dresses', 'Swimwear/Women''s Swimwear/Swim Dresses', 12.0, 6.0),
('Swimwear', 'Women''s Swimwear', 'Cover-ups & Sarongs', 'Swimwear/Women''s Swimwear/Cover-ups & Sarongs', 12.0, 6.0),
('Swimwear', 'Women''s Swimwear', 'Plus Size Swimwear', 'Swimwear/Women''s Swimwear/Plus Size Swimwear', 12.0, 6.0),
('Swimwear', 'Women''s Swimwear', 'Maternity Swimwear', 'Swimwear/Women''s Swimwear/Maternity Swimwear', 12.0, 6.0),
('Swimwear', 'Men''s Swimwear', 'Swim Trunks', 'Swimwear/Men''s Swimwear/Swim Trunks', 12.0, 6.0),
('Swimwear', 'Men''s Swimwear', 'Board Shorts', 'Swimwear/Men''s Swimwear/Board Shorts', 12.0, 6.0),
('Swimwear', 'Men''s Swimwear', 'Briefs', 'Swimwear/Men''s Swimwear/Briefs', 12.0, 6.0),
('Swimwear', 'Men''s Swimwear', 'Jammers', 'Swimwear/Men''s Swimwear/Jammers', 12.0, 6.0),
('Swimwear', 'Kids'' Swimwear', 'Girls'' Swimsuits', 'Swimwear/Kids'' Swimwear/Girls'' Swimsuits', 12.0, 6.0),
('Swimwear', 'Kids'' Swimwear', 'One-Piece', 'Swimwear/Kids'' Swimwear/One-Piece', 12.0, 6.0),
('Swimwear', 'Kids'' Swimwear', 'Two-Piece', 'Swimwear/Kids'' Swimwear/Two-Piece', 12.0, 6.0),
('Swimwear', 'Kids'' Swimwear', 'Boys'' Swimsuits', 'Swimwear/Kids'' Swimwear/Boys'' Swimsuits', 12.0, 6.0),
('Swimwear', 'Kids'' Swimwear', 'Swim Shorts', 'Swimwear/Kids'' Swimwear/Swim Shorts', 12.0, 6.0),
('Swimwear', 'Kids'' Swimwear', 'Rash Guards', 'Swimwear/Kids'' Swimwear/Rash Guards', 12.0, 6.0),
('Swimwear', 'Kids'' Swimwear', 'Swim Diapers', 'Swimwear/Kids'' Swimwear/Swim Diapers', 12.0, 6.0),
('Swimwear', 'Accessories', 'Swimming Goggles', 'Swimwear/Accessories/Swimming Goggles', 10.0, 5.0),
('Swimwear', 'Accessories', 'Swim Caps', 'Swimwear/Accessories/Swim Caps', 10.0, 5.0),
('Swimwear', 'Accessories', 'Beach Towels', 'Swimwear/Accessories/Beach Towels', 10.0, 5.0),
('Swimwear', 'Accessories', 'Flip-Flops', 'Swimwear/Accessories/Flip-Flops', 10.0, 5.0),
('Swimwear', 'Accessories', 'Swim Bags', 'Swimwear/Accessories/Swim Bags', 10.0, 5.0),
('Swimwear', 'Accessories', 'UV Protection Swimwear', 'Swimwear/Accessories/UV Protection Swimwear', 10.0, 5.0),

-- Home & Living
('Home & Living', 'Furniture', 'Beds & Mattresses', 'Home & Living/Furniture/Beds & Mattresses', 8.0, 4.0),
('Home & Living', 'Furniture', 'Sofas & Couches', 'Home & Living/Furniture/Sofas & Couches', 8.0, 4.0),
('Home & Living', 'Furniture', 'Dining Sets', 'Home & Living/Furniture/Dining Sets', 8.0, 4.0),
('Home & Living', 'Furniture', 'Wardrobes', 'Home & Living/Furniture/Wardrobes', 8.0, 4.0),
('Home & Living', 'Furniture', 'Office Desks', 'Home & Living/Furniture/Office Desks', 8.0, 4.0),
('Home & Living', 'Home Décor', 'Curtains', 'Home & Living/Home Décor/Curtains', 10.0, 5.0),
('Home & Living', 'Home Décor', 'Wall Art', 'Home & Living/Home Décor/Wall Art', 10.0, 5.0),
('Home & Living', 'Home Décor', 'Rugs & Carpets', 'Home & Living/Home Décor/Rugs & Carpets', 10.0, 5.0),
('Home & Living', 'Home Décor', 'Lighting', 'Home & Living/Home Décor/Lighting', 10.0, 5.0),
('Home & Living', 'Home Décor', 'Clocks', 'Home & Living/Home Décor/Clocks', 10.0, 5.0),
('Home & Living', 'Kitchen & Dining', 'Cookware', 'Home & Living/Kitchen & Dining/Cookware', 10.0, 5.0),
('Home & Living', 'Kitchen & Dining', 'Bakeware', 'Home & Living/Kitchen & Dining/Bakeware', 10.0, 5.0),
('Home & Living', 'Kitchen & Dining', 'Dinner Sets', 'Home & Living/Kitchen & Dining/Dinner Sets', 10.0, 5.0),
('Home & Living', 'Kitchen & Dining', 'Utensils', 'Home & Living/Kitchen & Dining/Utensils', 10.0, 5.0),
('Home & Living', 'Kitchen & Dining', 'Storage Containers', 'Home & Living/Kitchen & Dining/Storage Containers', 10.0, 5.0),
('Home & Living', 'Home Essentials', 'Brooms & Mops', 'Home & Living/Home Essentials/Brooms & Mops', 10.0, 5.0),
('Home & Living', 'Home Essentials', 'Laundry Baskets', 'Home & Living/Home Essentials/Laundry Baskets', 10.0, 5.0),
('Home & Living', 'Home Essentials', 'Buckets & Basins', 'Home & Living/Home Essentials/Buckets & Basins', 10.0, 5.0),
('Home & Living', 'Home Essentials', 'Dustbins', 'Home & Living/Home Essentials/Dustbins', 10.0, 5.0),

-- Books & Stationery
('Books & Stationery', 'Academic Books', NULL, 'Books & Stationery/Academic Books', 8.0, 4.0),
('Books & Stationery', 'Novels', NULL, 'Books & Stationery/Novels', 8.0, 4.0),
('Books & Stationery', 'Religious Books', NULL, 'Books & Stationery/Religious Books', 8.0, 4.0),
('Books & Stationery', 'Notebooks & Diaries', NULL, 'Books & Stationery/Notebooks & Diaries', 10.0, 5.0),
('Books & Stationery', 'Pens & Pencils', NULL, 'Books & Stationery/Pens & Pencils', 10.0, 5.0),
('Books & Stationery', 'Calculators', NULL, 'Books & Stationery/Calculators', 8.0, 4.0),
('Books & Stationery', 'Art Supplies', NULL, 'Books & Stationery/Art Supplies', 10.0, 5.0),

-- Baby Products
('Baby Products', 'Diapers & Wipes', NULL, 'Baby Products/Diapers & Wipes', 8.0, 4.0),
('Baby Products', 'Baby Food', NULL, 'Baby Products/Baby Food', 8.0, 4.0),
('Baby Products', 'Baby Bath & Skincare', NULL, 'Baby Products/Baby Bath & Skincare', 8.0, 4.0),
('Baby Products', 'Nursing & Feeding', NULL, 'Baby Products/Nursing & Feeding', 8.0, 4.0),
('Baby Products', 'Baby Gear', 'Strollers', 'Baby Products/Baby Gear/Strollers', 8.0, 4.0),
('Baby Products', 'Baby Gear', 'Car Seats', 'Baby Products/Baby Gear/Car Seats', 8.0, 4.0),
('Baby Products', 'Baby Gear', 'Baby Carriers', 'Baby Products/Baby Gear/Baby Carriers', 8.0, 4.0),

-- Health & Beauty
('Health & Beauty', 'Beauty', 'Makeup', 'Health & Beauty/Beauty/Makeup', 10.0, 5.0),
('Health & Beauty', 'Beauty', 'Skincare', 'Health & Beauty/Beauty/Skincare', 10.0, 5.0),
('Health & Beauty', 'Beauty', 'Haircare', 'Health & Beauty/Beauty/Haircare', 10.0, 5.0),
('Health & Beauty', 'Beauty', 'Fragrances', 'Health & Beauty/Beauty/Fragrances', 10.0, 5.0),
('Health & Beauty', 'Beauty', 'Beauty Tools', 'Health & Beauty/Beauty/Beauty Tools', 10.0, 5.0),

-- Tools & Home Improvement
('Tools & Home Improvement', 'Power Tools', NULL, 'Tools & Home Improvement/Power Tools', 8.0, 4.0),
('Tools & Home Improvement', 'Hand Tools', NULL, 'Tools & Home Improvement/Hand Tools', 8.0, 4.0),
('Tools & Home Improvement', 'Plumbing Supplies', NULL, 'Tools & Home Improvement/Plumbing Supplies', 8.0, 4.0),
('Tools & Home Improvement', 'Electrical Fixtures', NULL, 'Tools & Home Improvement/Electrical Fixtures', 8.0, 4.0),
('Tools & Home Improvement', 'Paint & Wall Treatments', NULL, 'Tools & Home Improvement/Paint & Wall Treatments', 8.0, 4.0),

-- Automotive
('Automotive', 'Car Accessories', 'Seat Covers', 'Automotive/Car Accessories/Seat Covers', 10.0, 5.0),
('Automotive', 'Car Accessories', 'Air Fresheners', 'Automotive/Car Accessories/Air Fresheners', 10.0, 5.0),
('Automotive', 'Car Accessories', 'Car Vacuum Cleaners', 'Automotive/Car Accessories/Car Vacuum Cleaners', 10.0, 5.0),
('Automotive', 'Spear parts', NULL, 'Automotive/Spear parts', 8.0, 4.0),
('Automotive', 'Motor Oil & Fluids', NULL, 'Automotive/Motor Oil & Fluids', 8.0, 4.0),
('Automotive', 'Tyres & Rims', NULL, 'Automotive/Tyres & Rims', 6.0, 3.0),
('Automotive', 'Motorcycles & Scooters', NULL, 'Automotive/Motorcycles & Scooters', 6.0, 3.0),
('Automotive', 'Helmets & Riding Gear', NULL, 'Automotive/Helmets & Riding Gear', 8.0, 4.0),

-- Travel & Luggage
('Travel & Luggage', 'Suitcases', NULL, 'Travel & Luggage/Suitcases', 10.0, 5.0),
('Travel & Luggage', 'Travel Backpacks', NULL, 'Travel & Luggage/Travel Backpacks', 10.0, 5.0),
('Travel & Luggage', 'Duffel Bags', NULL, 'Travel & Luggage/Duffel Bags', 10.0, 5.0),
('Travel & Luggage', 'Travel Accessories', NULL, 'Travel & Luggage/Travel Accessories', 10.0, 5.0),

-- Groceries
('Groceries', 'Beverages', 'Water', 'Groceries/Beverages/Water', 5.0, 2.5),
('Groceries', 'Beverages', 'Juice', 'Groceries/Beverages/Juice', 5.0, 2.5),
('Groceries', 'Beverages', 'Soft Drinks', 'Groceries/Beverages/Soft Drinks', 5.0, 2.5),
('Groceries', 'Dry Foods', 'Rice', 'Groceries/Dry Foods/Rice', 5.0, 2.5),
('Groceries', 'Dry Foods', 'Pasta', 'Groceries/Dry Foods/Pasta', 5.0, 2.5),
('Groceries', 'Dry Foods', 'Cereals', 'Groceries/Dry Foods/Cereals', 5.0, 2.5),
('Groceries', 'Dry Foods', 'Snacks', 'Groceries/Dry Foods/Snacks', 5.0, 2.5),
('Groceries', 'Spices & Condiments', 'Household Essentials', 'Groceries/Spices & Condiments/Household Essentials', 5.0, 2.5),
('Groceries', 'Spices & Condiments', 'Tissue Paper', 'Groceries/Spices & Condiments/Tissue Paper', 5.0, 2.5),
('Groceries', 'Spices & Condiments', 'Detergents', 'Groceries/Spices & Condiments/Detergents', 5.0, 2.5),
('Groceries', 'Spices & Condiments', 'Cleaning Products', 'Groceries/Spices & Condiments/Cleaning Products', 5.0, 2.5),

-- Office & Industrial
('Office & Industrial', 'Office Furniture', NULL, 'Office & Industrial/Office Furniture', 8.0, 4.0),
('Office & Industrial', 'Printers & Toners', NULL, 'Office & Industrial/Printers & Toners', 8.0, 4.0),
('Office & Industrial', 'Office Electronics', NULL, 'Office & Industrial/Office Electronics', 8.0, 4.0),
('Office & Industrial', 'Packaging Materials', NULL, 'Office & Industrial/Packaging Materials', 8.0, 4.0),
('Office & Industrial', 'Safety & Security Equipment', NULL, 'Office & Industrial/Safety & Security Equipment', 8.0, 4.0),

-- Alcoholic Beverages
('Alcoholic Beverages', 'Beer', 'Lager', 'Alcoholic Beverages/Beer/Lager', 3.0, 1.5),
('Alcoholic Beverages', 'Beer', 'Stout', 'Alcoholic Beverages/Beer/Stout', 3.0, 1.5),
('Alcoholic Beverages', 'Beer', 'Ale', 'Alcoholic Beverages/Beer/Ale', 3.0, 1.5),
('Alcoholic Beverages', 'Beer', 'Craft Beer', 'Alcoholic Beverages/Beer/Craft Beer', 3.0, 1.5),
('Alcoholic Beverages', 'Beer', 'Non-Alcoholic Beer', 'Alcoholic Beverages/Beer/Non-Alcoholic Beer', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Red Wine', 'Alcoholic Beverages/Wine/Red Wine', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Merlot', 'Alcoholic Beverages/Wine/Merlot', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Cabernet Sauvignon', 'Alcoholic Beverages/Wine/Cabernet Sauvignon', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Shiraz', 'Alcoholic Beverages/Wine/Shiraz', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'White Wine', 'Alcoholic Beverages/Wine/White Wine', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Chardonnay', 'Alcoholic Beverages/Wine/Chardonnay', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Sauvignon Blanc', 'Alcoholic Beverages/Wine/Sauvignon Blanc', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Rosé Wine', 'Alcoholic Beverages/Wine/Rosé Wine', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Sparkling Wine', 'Alcoholic Beverages/Wine/Sparkling Wine', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Champagne', 'Alcoholic Beverages/Wine/Champagne', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Prosecco', 'Alcoholic Beverages/Wine/Prosecco', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Fortified Wine', 'Alcoholic Beverages/Wine/Fortified Wine', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Port', 'Alcoholic Beverages/Wine/Port', 3.0, 1.5),
('Alcoholic Beverages', 'Wine', 'Sherry', 'Alcoholic Beverages/Wine/Sherry', 3.0, 1.5),
('Alcoholic Beverages', 'Spirits', 'Whisky', 'Alcoholic Beverages/Spirits/Whisky', 3.0, 1.5),
('Alcoholic Beverages', 'Spirits', 'Scotch Whisky', 'Alcoholic Beverages/Spirits/Scotch Whisky', 3.0, 1.5),
('Alcoholic Beverages', 'Spirits', 'Bourbon', 'Alcoholic Beverages/Spirits/Bourbon', 3.0, 1.5),
('Alcoholic Beverages', 'Spirits', 'Irish Whiskey', 'Alcoholic Beverages/Spirits/Irish Whiskey', 3.0, 1.5),
('Alcoholic Beverages', 'Spirits', 'Vodka', 'Alcoholic Beverages/Spirits/Vodka', 3.0, 1.5),
('Alcoholic Beverages', 'Spirits', 'Gin', 'Alcoholic Beverages/Spirits/Gin', 3.0, 1.5),
('Alcoholic Beverages', 'Alcohol Gift Sets & Accessories', 'Gift Packs (Assorted)', 'Alcoholic Beverages/Alcohol Gift Sets & Accessories/Gift Packs (Assorted)', 5.0, 2.5),
('Alcoholic Beverages', 'Alcohol Gift Sets & Accessories', 'Wine Openers', 'Alcoholic Beverages/Alcohol Gift Sets & Accessories/Wine Openers', 5.0, 2.5),
('Alcoholic Beverages', 'Alcohol Gift Sets & Accessories', 'Hip Flasks', 'Alcoholic Beverages/Alcohol Gift Sets & Accessories/Hip Flasks', 5.0, 2.5),
('Alcoholic Beverages', 'Alcohol Gift Sets & Accessories', 'Whiskey Stones', 'Alcoholic Beverages/Alcohol Gift Sets & Accessories/Whiskey Stones', 5.0, 2.5),
('Alcoholic Beverages', 'Alcohol Gift Sets & Accessories', 'Bar Sets & Glassware', 'Alcoholic Beverages/Alcohol Gift Sets & Accessories/Bar Sets & Glassware', 5.0, 2.5);

-- Create indexes for better performance
CREATE INDEX idx_vendor_commissions_category_path ON public.vendor_commissions(category_path);
CREATE INDEX idx_vendor_commissions_main_category ON public.vendor_commissions(main_category);

-- Function to get commission rate for a vendor and category
CREATE OR REPLACE FUNCTION public.get_vendor_commission_rate(vendor_id_param uuid, category_path_param text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  vendor_plan text;
  commission_rate numeric;
BEGIN
  -- Get vendor's subscription plan
  SELECT plan_type INTO vendor_plan
  FROM public.vendor_subscriptions
  WHERE vendor_id = vendor_id_param 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to freemium if no active subscription
  IF vendor_plan IS NULL THEN
    vendor_plan := 'freemium';
  END IF;
  
  -- Get commission rate based on plan and category
  IF vendor_plan = 'premium' THEN
    SELECT premium_commission_rate INTO commission_rate
    FROM public.vendor_commissions
    WHERE category_path = category_path_param
      AND is_active = true
    LIMIT 1;
  ELSE
    SELECT freemium_commission_rate INTO commission_rate
    FROM public.vendor_commissions
    WHERE category_path = category_path_param
      AND is_active = true
    LIMIT 1;
  END IF;
  
  -- Return default rate if no specific rate found
  IF commission_rate IS NULL THEN
    IF vendor_plan = 'premium' THEN
      commission_rate := 5.0;
    ELSE
      commission_rate := 10.0;
    END IF;
  END IF;
  
  RETURN commission_rate;
END;
$$;
