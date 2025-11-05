// AI-powered search service using OpenAI or similar AI
export interface AISearchResult {
  category: string | null;
  confidence: number;
  reasoning: string;
  alternativeCategories?: string[];
}

export class AISearchService {
  private static readonly CATEGORIES = [
    'automobile',
    'thrift', 
    'electronics',
    'catering',
    'jobs',
    'real-estate',
    'raw-materials-industrial',
    'construction',
    'healthcare',
    'education',
    'wedding-events',
    'waste-management',
    'other'
  ];

  private static readonly CATEGORY_DESCRIPTIONS = {
    'automobile': 'Cars, vehicles, bikes, motorcycles, trucks, transportation, automotive parts, vehicle services',
    'thrift': 'Clothing, fashion, accessories, shoes, bags, jewelry, second-hand items, personal style',
    'electronics': 'Phones, laptops, computers, gadgets, tech devices, cameras, audio equipment, electronic components',
    'catering': 'Food, meals, restaurants, cooking, catering services, kitchen equipment, culinary services',
    'jobs': 'Employment, work opportunities, career positions, hiring, recruitment, professional services',
    'real-estate': 'Houses, properties, rent, buy, apartments, land, real estate services, property management',
    'raw-materials-industrial': 'Fuel, oil, chemicals, steel, metal, plastic, rubber, cement, lumber, industrial materials, manufacturing supplies',
    'construction': 'Building, construction, renovation, repair, maintenance, plumbing, electrical, painting, roofing',
    'healthcare': 'Medical services, healthcare, doctors, nurses, hospitals, clinics, pharmacy, therapy, wellness, fitness',
    'education': 'Schools, colleges, universities, tutoring, training, courses, teachers, learning, education services',
    'wedding-events': 'Weddings, parties, celebrations, events, functions, ceremonies, receptions, festivals',
    'waste-management': 'Waste disposal, recycling, garbage, cleaning, hygiene, sanitation, environmental services',
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
      'automobile': [
        /\b(car|cars|vehicle|vehicles|auto|automobile|bike|bikes|motorcycle|motorcycles|truck|trucks|scooter|scooters|bus|buses|van|vans|transport|transportation|driving|driver|ride|rides)\b/,
        /\b(engine|motor|brake|brakes|tire|tires|wheel|wheels|fuel|gas|petrol|diesel|oil|lubricant)\b/,
        /\b(garage|mechanic|repair|maintenance|service|parts|accessories|insurance|registration)\b/
      ],
      'thrift': [
        /\b(clothing|clothes|fashion|dress|dresses|shirt|shirts|pants|trousers|jeans|shoes|boots|sneakers|sandals|heels|flats)\b/,
        /\b(jacket|jackets|coat|coats|sweater|sweaters|hoodie|hoodies|t-shirt|tshirt|blouse|blouses)\b/,
        /\b(bag|bags|purse|purses|handbag|handbags|backpack|backpacks|wallet|wallets|belt|belts)\b/,
        /\b(jewelry|jewellery|necklace|necklaces|earrings|bracelet|bracelets|ring|rings|watch|watches)\b/,
        /\b(accessories|fashion|style|outfit|outfits|wardrobe|thrift|secondhand|used|vintage)\b/
      ],
      'electronics': [
        /\b(phone|phones|mobile|smartphone|iphone|android|samsung|xiaomi|oneplus|huawei)\b/,
        /\b(laptop|laptops|computer|computers|pc|mac|macbook|desktop|monitor|monitors|keyboard|mouse)\b/,
        /\b(tablet|tablets|ipad|android tablet|surface|kindle|ereader)\b/,
        /\b(camera|cameras|dslr|mirrorless|gopro|action camera|video|recording)\b/,
        /\b(headphones|earphones|earbuds|speaker|speakers|audio|sound|music|gaming|console)\b/,
        /\b(tv|television|smart tv|led|lcd|oled|projector|home theater|entertainment)\b/,
        /\b(gadget|gadgets|tech|technology|electronic|electronics|device|devices|smart|iot)\b/
      ],
      'catering': [
        /\b(food|meal|meals|eat|eating|restaurant|restaurants|cafe|cafes|coffee|tea|drink|drinks)\b/,
        /\b(cooking|chef|cook|kitchen|recipe|recipes|ingredients|spices|herbs|flavors)\b/,
        /\b(catering|caterer|party|parties|event|events|celebration|celebrations|wedding|birthday)\b/,
        /\b(delivery|takeout|takeaway|dine|dining|menu|menus|cuisine|cuisines|taste|tasting)\b/,
        /\b(bakery|baker|bread|cake|cakes|pastry|pastries|dessert|desserts|sweet|sweets)\b/
      ],
      'jobs': [
        /\b(job|jobs|work|employment|career|careers|position|positions|hiring|recruitment|recruit)\b/,
        /\b(employee|employees|staff|worker|workers|professional|professionals|expert|experts)\b/,
        /\b(manager|managers|director|directors|executive|executives|officer|officers|assistant|assistants)\b/,
        /\b(developer|developers|engineer|engineers|designer|designers|marketing|sales|finance|hr)\b/,
        /\b(part-time|full-time|contract|freelance|remote|work from home|wfh|office|offices)\b/
      ],
      'real-estate': [
        /\b(house|houses|home|homes|property|properties|apartment|apartments|flat|flats|condo|condos)\b/,
        /\b(rent|rental|renting|lease|leasing|buy|buying|purchase|purchasing|sell|selling|sale|sales)\b/,
        /\b(land|plot|plots|villa|villas|mansion|mansions|townhouse|townhouses|studio|studios)\b/,
        /\b(real estate|realtor|realtors|agent|agents|broker|brokers|property management)\b/,
        /\b(mortgage|loan|loans|financing|investment|investments|commercial|residential)\b/
      ],
      'raw-materials-industrial': [
        /\b(fuel|oil|crude|petroleum|diesel|gas|petrol|chemicals|chemical|steel|metal|metals)\b/,
        /\b(plastic|plastics|rubber|cement|concrete|lumber|timber|wood|materials|material)\b/,
        /\b(industrial|manufacturing|production|factory|factories|plant|plants|machinery|equipment)\b/,
        /\b(supplies|supply|components|parts|hardware|tools|raw|raw materials|bulk|wholesale)\b/,
        /\b(mining|extraction|processing|refining|synthesis|compound|compounds|alloy|alloys)\b/
      ],
      'construction': [
        /\b(construction|building|build|builds|contractor|contractors|renovation|renovations|repair|repairs)\b/,
        /\b(maintenance|maintain|plumbing|plumber|electrical|electrician|painting|painter|roofing|roofer)\b/,
        /\b(flooring|tiling|carpentry|carpenter|masonry|mason|welding|welder|installation|install)\b/,
        /\b(remodeling|remodel|renovate|restore|restoration|demolition|demolish|excavation|excavate)\b/,
        /\b(architecture|architect|design|designer|planning|planner|engineering|engineer|survey|surveyor)\b/
      ],
      'healthcare': [
        /\b(healthcare|health|medical|medicine|doctor|doctors|physician|physicians|nurse|nurses)\b/,
        /\b(hospital|hospitals|clinic|clinics|pharmacy|pharmacist|therapist|therapy|treatment|treatments)\b/,
        /\b(wellness|fitness|gym|gyms|exercise|training|coach|coaching|nutrition|diet|dietician)\b/,
        /\b(mental health|psychology|psychologist|psychiatrist|counseling|counselor|therapy|therapist)\b/,
        /\b(emergency|urgent|ambulance|paramedic|first aid|rescue|rescue services|medical equipment)\b/
      ],
      'education': [
        /\b(education|school|schools|college|colleges|university|universities|learning|learn|study|studies)\b/,
        /\b(teacher|teachers|tutor|tutors|tutoring|training|course|courses|class|classes|lesson|lessons)\b/,
        /\b(student|students|pupil|pupils|academic|academics|scholar|scholars|research|researcher)\b/,
        /\b(degree|degrees|diploma|diplomas|certificate|certificates|qualification|qualifications)\b/,
        /\b(online|offline|distance|remote|virtual|classroom|classrooms|library|libraries|books)\b/
      ],
      'wedding-events': [
        /\b(wedding|weddings|marriage|marriages|bride|groom|ceremony|ceremonies|reception|receptions)\b/,
        /\b(party|parties|celebration|celebrations|event|events|function|functions|gathering|gatherings)\b/,
        /\b(birthday|birthdays|anniversary|anniversaries|graduation|graduations|festival|festivals)\b/,
        /\b(venue|venues|hall|halls|banquet|banquets|catering|caterer|photography|photographer)\b/,
        /\b(decoration|decorations|flowers|florist|music|musician|entertainment|entertainer|dj|djs)\b/
      ],
      'waste-management': [
        /\b(waste|garbage|trash|rubbish|refuse|disposal|dispose|recycling|recycle|recyclable)\b/,
        /\b(cleaning|clean|cleaner|cleaners|hygiene|sanitation|sanitary|environment|environmental)\b/,
        /\b(compost|composting|biodegradable|sustainable|sustainability|green|eco|ecological)\b/,
        /\b(collection|collector|collectors|pickup|pick-up|removal|removers|dumping|dump|landfill)\b/,
        /\b(sewage|sewer|drain|drains|plumbing|plumber|maintenance|maintain|service|services)\b/
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

