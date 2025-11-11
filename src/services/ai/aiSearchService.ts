// AI-powered search service using OpenAI or similar AI
export interface AISearchResult {
  category: string | null;
  confidence: number;
  reasoning: string;
  alternativeCategories?: string[];
}

export class AISearchService {
  // All categories from PostEnquiry form
  private static readonly CATEGORIES = [
    'agriculture-farming',
    'antiques',
    'art',
    'automobile',
    'books-publications',
    'childcare-family',
    'collectibles',
    'construction-renovation',
    'education-training',
    'electronics-gadgets',
    'entertainment-media',
    'events-entertainment',
    'fashion-apparel',
    'food-beverage',
    'gaming-recreation',
    'government-public',
    'health-beauty',
    'home-furniture',
    'insurance-services',
    'jobs',
    'jewelry-accessories',
    'legal-financial',
    'marketing-advertising',
    'memorabilia',
    'non-profit-charity',
    'pets',
    'professional-services',
    'raw-materials-industrial',
    'real-estate',
    'real-estate-services',
    'renewable-energy',
    'security-safety',
    'sneakers',
    'souvenir',
    'sports-outdoor',
    'technology',
    'thrift',
    'transportation-logistics',
    'travel-tourism',
    'vintage',
    'waste-management',
    'wedding-events',
    'other'
  ];

  private static readonly CATEGORY_DESCRIPTIONS = {
    'agriculture-farming': 'Farming, crops, livestock, agricultural equipment, seeds, fertilizers, farming services, agricultural products',
    'antiques': 'Antique items, collectibles, vintage artifacts, historical items, rare collectibles',
    'art': 'Artwork, paintings, sculptures, artistic services, art supplies, creative works',
    'automobile': 'Cars, vehicles, bikes, motorcycles, trucks, transportation, automotive parts, vehicle services',
    'books-publications': 'Books, literature, reading materials, educational books, novels, textbooks, publications',
    'childcare-family': 'Childcare services, babysitting, nanny services, daycare, children activities, family services',
    'collectibles': 'Collectible items, rare items, memorabilia, special collections',
    'construction-renovation': 'Building, construction, renovation, repair, maintenance, plumbing, electrical, painting, roofing',
    'education-training': 'Schools, colleges, universities, tutoring, training, courses, teachers, learning, education services',
    'electronics-gadgets': 'Phones, laptops, computers, gadgets, tech devices, cameras, audio equipment, electronic components',
    'entertainment-media': 'Entertainment services, shows, performances, media, amusement, broadcasting',
    'events-entertainment': 'Events, parties, celebrations, functions, gatherings, event planning, entertainment',
    'fashion-apparel': 'Clothing, fashion, accessories, shoes, bags, jewelry, personal style, apparel',
    'food-beverage': 'Food, meals, restaurants, cooking, catering services, kitchen equipment, culinary services, beverages',
    'gaming-recreation': 'Gaming equipment, video games, gaming consoles, gaming accessories, recreation',
    'government-public': 'Government services, public services, official services, administrative services',
    'health-beauty': 'Medical services, healthcare, doctors, nurses, hospitals, clinics, pharmacy, therapy, wellness, fitness, beauty',
    'home-furniture': 'Home goods, furniture, home decor, household items, home services',
    'insurance-services': 'Insurance services, insurance products, coverage, policies',
    'jobs': 'Employment, work opportunities, career positions, hiring, recruitment, professional services',
    'jewelry-accessories': 'Jewelry, watches, accessories, precious metals, gemstones',
    'legal-financial': 'Legal services, lawyers, legal advice, legal consultation, law services, financial services',
    'marketing-advertising': 'Marketing services, advertising, promotional services, branding',
    'memorabilia': 'Memorabilia, collectibles, souvenirs, keepsakes, historical items',
    'non-profit-charity': 'Non-profit services, charity, donations, social services, community services',
    'pets': 'Pet services, pet care, pet supplies, veterinary services, pet products',
    'professional-services': 'General services, professional services, service providers',
    'raw-materials-industrial': 'Fuel, oil, chemicals, steel, metal, plastic, rubber, cement, lumber, industrial materials, manufacturing supplies',
    'real-estate': 'Houses, properties, rent, buy, apartments, land, real estate services, property management',
    'real-estate-services': 'Real estate services, property management, real estate consultation',
    'renewable-energy': 'Renewable energy, solar, wind, green energy, sustainable energy',
    'security-safety': 'Security services, security systems, safety services, protection services',
    'sneakers': 'Sneakers, athletic shoes, sports shoes, footwear',
    'souvenir': 'Souvenirs, keepsakes, mementos, gifts',
    'sports-outdoor': 'Sports equipment, sports services, athletic goods, fitness equipment, outdoor activities',
    'technology': 'Technology services, tech products, IT services, software, hardware',
    'thrift': 'Second-hand items, used goods, thrift store items, vintage clothing',
    'transportation-logistics': 'Transportation services, shipping, logistics, transport',
    'travel-tourism': 'Travel services, tourism, travel planning, travel products',
    'vintage': 'Vintage items, retro products, classic items, old collectibles',
    'waste-management': 'Waste disposal, recycling, garbage, cleaning, hygiene, sanitation, environmental services',
    'wedding-events': 'Weddings, wedding services, marriage ceremonies, wedding planning, events',
    'other': 'General services, miscellaneous, help, support, consultation, assistance'
  };

  static async analyzeSearchQuery(searchTerm: string): Promise<AISearchResult> {
    try {
      // For now, use a smart rule-based system that can be easily replaced with actual AI
      const normalizedTerm = searchTerm.toLowerCase().trim();
      
      // Create a comprehensive analysis
      const analysis = this.analyzeWithRules(normalizedTerm);
      
      return {
        category: analysis.category,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        alternativeCategories: analysis.alternatives
      };
    } catch (error) {
      console.error('AI Search Error:', error);
      return {
        category: null,
        confidence: 0,
        reasoning: 'Error analyzing search query'
      };
    }
  }

  private static analyzeWithRules(searchTerm: string): {
    category: string | null;
    confidence: number;
    reasoning: string;
    alternatives: string[];
  } {
    // Define comprehensive keyword patterns for each category
    const patterns = {
      'agriculture-farming': [
        /\b(agriculture|agricultural|farming|farm|farms|farmer|farmers|crop|crops|harvest|harvesting)\b/,
        /\b(livestock|cattle|cow|cows|sheep|goat|goats|pig|pigs|chicken|chickens|poultry)\b/,
        /\b(seed|seeds|fertilizer|fertilizers|pesticide|pesticides|irrigation|tractor|tractors)\b/,
        /\b(agricultural equipment|farming equipment|farm machinery|agricultural products)\b/,
        /\b(organic|organic farming|sustainable agriculture|agri|agribusiness|horticulture)\b/
      ],
      'antiques': [
        /\b(antique|antiques|vintage|collectible|collectibles|rare|historical|artifact|artifacts)\b/,
        /\b(old|ancient|classic|retro|heritage|traditional|period piece|estate|estate sale)\b/
      ],
      'art': [
        /\b(art|arts|artwork|painting|paintings|sculpture|sculptures|artist|artists|creative)\b/,
        /\b(drawing|drawings|sketch|sketches|canvas|gallery|galleries|exhibition|exhibitions)\b/,
        /\b(artistic|artistry|fine art|visual art|art supplies|art materials|artistic services)\b/
      ],
      'automobile': [
        /\b(car|cars|vehicle|vehicles|auto|automobile|bike|bikes|motorcycle|motorcycles|truck|trucks|scooter|scooters|bus|buses|van|vans|transport|transportation|driving|driver|ride|rides)\b/,
        /\b(engine|motor|brake|brakes|tire|tires|wheel|wheels|fuel|gas|petrol|diesel|oil|lubricant)\b/,
        /\b(garage|mechanic|repair|maintenance|service|parts|accessories|insurance|registration)\b/
      ],
      'books-publications': [
        /\b(book|books|novel|novels|literature|reading|author|authors|publisher|publishers)\b/,
        /\b(textbook|textbooks|library|libraries|story|stories|fiction|non-fiction|biography)\b/,
        /\b(publication|publications|magazine|magazines|journal|journals|paper|papers)\b/
      ],
      'childcare-family': [
        /\b(childcare|child care|babysitting|babysitter|nanny|nannies|daycare|day care)\b/,
        /\b(kids|children|toddler|toddlers|infant|infants|baby|babies|childcare services)\b/,
        /\b(family|families|parenting|parents|guardian|guardians|family services)\b/
      ],
      'collectibles': [
        /\b(collectible|collectibles|collection|collections|collector|collectors|rare|rarity)\b/,
        /\b(memorabilia|souvenir|souvenirs|keepsake|keepsakes|treasure|treasures)\b/
      ],
      'construction-renovation': [
        /\b(construction|building|build|builds|contractor|contractors|renovation|renovations|repair|repairs)\b/,
        /\b(maintenance|maintain|plumbing|plumber|electrical|electrician|painting|painter|roofing|roofer)\b/,
        /\b(flooring|tiling|carpentry|carpenter|masonry|mason|welding|welder|installation|install)\b/,
        /\b(remodeling|remodel|renovate|restore|restoration|demolition|demolish|excavation|excavate)\b/
      ],
      'education-training': [
        /\b(education|school|schools|college|colleges|university|universities|learning|learn|study|studies)\b/,
        /\b(teacher|teachers|tutor|tutors|tutoring|training|course|courses|class|classes|lesson|lessons)\b/,
        /\b(student|students|pupil|pupils|academic|academics|scholar|scholars|research|researcher)\b/
      ],
      'electronics-gadgets': [
        /\b(phone|phones|mobile|smartphone|iphone|android|samsung|xiaomi|oneplus|huawei)\b/,
        /\b(laptop|laptops|computer|computers|pc|mac|macbook|desktop|monitor|monitors|keyboard|mouse)\b/,
        /\b(tablet|tablets|ipad|android tablet|surface|kindle|ereader)\b/,
        /\b(camera|cameras|dslr|mirrorless|gopro|action camera|video|recording)\b/,
        /\b(gadget|gadgets|tech|technology|electronic|electronics|device|devices|smart|iot)\b/
      ],
      'entertainment-media': [
        /\b(entertainment|entertain|show|shows|performance|performances|concert|concerts)\b/,
        /\b(movie|movies|film|films|theater|theatre|comedy|drama|music|musical)\b/,
        /\b(media|broadcasting|broadcast|television|tv|radio|streaming|content)\b/
      ],
      'events-entertainment': [
        /\b(event|events|party|parties|celebration|celebrations|function|functions|gathering|gatherings)\b/,
        /\b(conference|conferences|seminar|seminars|workshop|workshops|meeting|meetings)\b/,
        /\b(entertainment|entertainer|entertainers|dj|djs|performer|performers)\b/
      ],
      'fashion-apparel': [
        /\b(fashion|style|trend|trends|apparel|clothing|clothes|outfit|outfits|wardrobe)\b/,
        /\b(designer|designers|boutique|boutiques|couture|haute couture|fashionable)\b/,
        /\b(dress|dresses|shirt|shirts|pants|trousers|jeans|jacket|jackets|coat|coats)\b/
      ],
      'food-beverage': [
        /\b(food|meal|meals|eat|eating|restaurant|restaurants|cafe|cafes|coffee|tea|drink|drinks)\b/,
        /\b(cooking|chef|cook|kitchen|recipe|recipes|ingredients|spices|herbs|flavors)\b/,
        /\b(catering|caterer|party|parties|event|events|celebration|celebrations|wedding|birthday)\b/,
        /\b(beverage|beverages|beverage service|drink service|food service)\b/
      ],
      'gaming-recreation': [
        /\b(gaming|game|games|gamer|gamers|console|consoles|playstation|xbox|nintendo)\b/,
        /\b(video game|video games|pc gaming|mobile gaming|esports|gaming equipment)\b/,
        /\b(recreation|recreational|leisure|hobby|hobbies|fun|entertainment)\b/
      ],
      'government-public': [
        /\b(government|govt|public|official|authority|authorities|administrative|administration)\b/,
        /\b(civic|citizen|citizens|municipal|municipality|public service|public services)\b/
      ],
      'health-beauty': [
        /\b(health|healthcare|medical|medicine|doctor|doctors|physician|physicians|nurse|nurses)\b/,
        /\b(hospital|hospitals|clinic|clinics|pharmacy|pharmacist|therapist|therapy|treatment|treatments)\b/,
        /\b(wellness|fitness|gym|gyms|exercise|training|coach|coaching|nutrition|diet|dietician)\b/,
        /\b(beauty|cosmetic|cosmetics|salon|salons|spa|spas|skincare|makeup|hair|nail)\b/
      ],
      'home-furniture': [
        /\b(home|house|household|furniture|furnishings|decor|decoration|decorations|interior)\b/,
        /\b(appliance|appliances|home goods|household items|home improvement|home services)\b/,
        /\b(sofa|sofas|chair|chairs|table|tables|bed|beds|wardrobe|wardrobes|cabinet|cabinets)\b/
      ],
      'insurance-services': [
        /\b(insurance|coverage|policy|policies|insure|insured|premium|premiums|claim|claims)\b/,
        /\b(life insurance|health insurance|car insurance|home insurance|business insurance)\b/
      ],
      'jobs': [
        /\b(job|jobs|work|employment|career|careers|position|positions|hiring|recruitment|recruit)\b/,
        /\b(employee|employees|staff|worker|workers|professional|professionals|expert|experts)\b/,
        /\b(manager|managers|director|directors|executive|executives|officer|officers|assistant|assistants)\b/
      ],
      'jewelry-accessories': [
        /\b(jewelry|jewellery|necklace|necklaces|earrings|bracelet|bracelets|ring|rings|watch|watches)\b/,
        /\b(diamond|diamonds|gold|silver|platinum|gem|gems|gemstone|gemstones|precious)\b/,
        /\b(accessories|accessory|bag|bags|purse|purses|handbag|handbags|wallet|wallets|belt|belts)\b/
      ],
      'legal-financial': [
        /\b(legal|law|lawyer|lawyers|attorney|attorneys|advocate|advocates|counsel|counselor)\b/,
        /\b(legal advice|legal consultation|legal services|litigation|court|courts|justice)\b/,
        /\b(financial|finance|banking|bank|banks|accounting|accountant|accountants|tax|taxes)\b/
      ],
      'marketing-advertising': [
        /\b(marketing|advertising|advertise|promotion|promotions|branding|brand|brands)\b/,
        /\b(publicity|public relations|pr|social media|digital marketing|marketing services)\b/
      ],
      'memorabilia': [
        /\b(memorabilia|souvenir|souvenirs|keepsake|keepsakes|memento|mementos|trophy|trophies)\b/,
        /\b(autograph|autographs|signed|signature|signatures|collectible|collectibles)\b/
      ],
      'non-profit-charity': [
        /\b(non-profit|nonprofit|charity|charities|donation|donations|volunteer|volunteers)\b/,
        /\b(ngo|foundation|foundations|social service|social services|community service)\b/
      ],
      'pets': [
        /\b(pet|pets|dog|dogs|cat|cats|animal|animals|veterinary|vet|veterinarian|veterinarians)\b/,
        /\b(pet care|pet supplies|pet food|pet grooming|pet training|pet services)\b/
      ],
      'professional-services': [
        /\b(service|services|professional service|professional services|service provider)\b/,
        /\b(consulting|consultant|consultants|advisory|advisor|advisors|professional)\b/
      ],
      'raw-materials-industrial': [
        /\b(fuel|oil|crude|petroleum|diesel|gas|petrol|chemicals|chemical|steel|metal|metals)\b/,
        /\b(plastic|plastics|rubber|cement|concrete|lumber|timber|wood|materials|material)\b/,
        /\b(industrial|manufacturing|production|factory|factories|plant|plants|machinery|equipment)\b/
      ],
      'real-estate': [
        /\b(house|houses|home|homes|property|properties|apartment|apartments|flat|flats|condo|condos)\b/,
        /\b(rent|rental|renting|lease|leasing|buy|buying|purchase|purchasing|sell|selling|sale|sales)\b/,
        /\b(land|plot|plots|villa|villas|mansion|mansions|townhouse|townhouses|studio|studios)\b/
      ],
      'real-estate-services': [
        /\b(real estate service|real estate services|property management|property manager)\b/,
        /\b(real estate consultation|real estate advisory|property consulting)\b/
      ],
      'renewable-energy': [
        /\b(renewable energy|solar|wind|hydro|geothermal|green energy|sustainable energy)\b/,
        /\b(solar panel|solar panels|wind turbine|wind turbines|clean energy|alternative energy)\b/
      ],
      'security-safety': [
        /\b(security|secure|protection|safety|guard|guards|surveillance|monitoring)\b/,
        /\b(security system|security systems|alarm|alarms|cctv|security services|safety services)\b/
      ],
      'sneakers': [
        /\b(sneaker|sneakers|athletic shoes|sports shoes|footwear|running shoes|trainers)\b/,
        /\b(sports footwear|athletic footwear|sneaker collection|sneakerhead)\b/
      ],
      'souvenir': [
        /\b(souvenir|souvenirs|keepsake|keepsakes|memento|mementos|gift|gifts|remembrance)\b/
      ],
      'sports-outdoor': [
        /\b(sport|sports|athletic|athletics|fitness|exercise|training|coach|coaching)\b/,
        /\b(sports equipment|athletic equipment|sports gear|sports goods|sports services)\b/,
        /\b(outdoor|outdoors|camping|hiking|adventure|recreation|recreational)\b/
      ],
      'technology': [
        /\b(technology|tech|it|information technology|software|hardware|digital|innovation)\b/,
        /\b(tech services|it services|technology services|tech solutions|tech products)\b/
      ],
      'thrift': [
        /\b(thrift|second-hand|secondhand|used|pre-owned|vintage|hand-me-down|resale)\b/,
        /\b(thrift store|thrift shop|consignment|bargain|discount|affordable)\b/
      ],
      'transportation-logistics': [
        /\b(transportation|transport|shipping|logistics|delivery|freight|cargo|shipment)\b/,
        /\b(transport service|transport services|shipping service|logistics service)\b/
      ],
      'travel-tourism': [
        /\b(travel|tourism|tour|tours|trip|trips|vacation|vacations|holiday|holidays)\b/,
        /\b(travel service|travel services|travel planning|travel agent|travel agency)\b/
      ],
      'vintage': [
        /\b(vintage|retro|classic|old|antique|antiques|collectible|collectibles|heritage)\b/,
        /\b(vintage items|retro products|classic items|vintage goods|vintage collectibles)\b/
      ],
      'waste-management': [
        /\b(waste|garbage|trash|rubbish|refuse|disposal|dispose|recycling|recycle|recyclable)\b/,
        /\b(cleaning|clean|cleaner|cleaners|hygiene|sanitation|sanitary|environment|environmental)\b/,
        /\b(compost|composting|biodegradable|sustainable|sustainability|green|eco|ecological)\b/
      ],
      'wedding-events': [
        /\b(wedding|weddings|marriage|marriages|bride|groom|ceremony|ceremonies|reception|receptions)\b/,
        /\b(engagement|bridal|groom|bridesmaid|groomsman|vows|nuptials|matrimony)\b/,
        /\b(event|events|party|parties|celebration|celebrations)\b/
      ]
    };

    let bestMatch = { category: null as string | null, confidence: 0, reasoning: '', alternatives: [] as string[] };
    const matches: { category: string; confidence: number; reasoning: string }[] = [];

    // Test each category
    for (const [category, patternList] of Object.entries(patterns)) {
      let categoryConfidence = 0;
      let matchedPatterns: string[] = [];
      
      for (const pattern of patternList) {
        if (pattern.test(searchTerm)) {
          categoryConfidence += 0.3; // Each pattern match adds confidence
          matchedPatterns.push(pattern.source);
        }
      }
      
      if (categoryConfidence > 0) {
        matches.push({
          category,
          confidence: Math.min(categoryConfidence, 1), // Cap at 1
          reasoning: `Matched patterns: ${matchedPatterns.join(', ')}`
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    if (matches.length > 0) {
      bestMatch = {
        category: matches[0].category,
        confidence: matches[0].confidence,
        reasoning: matches[0].reasoning,
        alternatives: matches.slice(1, 3).map(m => m.category) // Top 2 alternatives
      };
    } else {
      // No matches found
      bestMatch = {
        category: null,
        confidence: 0,
        reasoning: `No patterns matched for "${searchTerm}"`,
        alternatives: []
      };
    }

    return bestMatch;
  }

  static async searchEnquiries(enquiries: any[], searchTerm: string): Promise<{
    results: any[];
    searchedCategory: string | null;
    noResultsInCategory: boolean;
    showAllFallback: boolean;
    aiAnalysis: AISearchResult;
  }> {
    const aiAnalysis = await this.analyzeSearchQuery(searchTerm);
    
    if (!aiAnalysis.category) {
      // Unknown keyword - show all enquiries
      return {
        results: enquiries,
        searchedCategory: null,
        noResultsInCategory: false,
        showAllFallback: true,
        aiAnalysis
      };
    }
    
    // Filter enquiries by AI-determined category
    const categoryResults = enquiries.filter(enquiry => 
      enquiry.category === aiAnalysis.category || 
      (enquiry.categories && enquiry.categories.includes(aiAnalysis.category))
    );
    
    if (categoryResults.length === 0) {
      // No results in AI-determined category - show message + all enquiries
      return {
        results: enquiries,
        searchedCategory: aiAnalysis.category,
        noResultsInCategory: true,
        showAllFallback: true,
        aiAnalysis
      };
    }
    
    return {
      results: categoryResults,
      searchedCategory: aiAnalysis.category,
      noResultsInCategory: false,
      showAllFallback: false,
      aiAnalysis
    };
  }
}
