import json

# 기초~중급 영한 사전 (패턴 영어에 자주 나오는 단어 위주)
VOCAB_DICT = {
    # 시간/빈도
    "tonight": "오늘 밤", "today": "오늘", "tomorrow": "내일", "yesterday": "어제",
    "now": "지금", "later": "나중에", "soon": "곧", "early": "일찍", "late": "늦게",
    "always": "항상", "usually": "보통", "often": "종종", "sometimes": "가끔",
    "never": "결코 ~않다", "daily": "매일의", "weekly": "매주의", "monthly": "매월의",
    "recently": "최근에", "lately": "요즘", "already": "이미", "yet": "아직",
    "finally": "마침내", "suddenly": "갑자기", "immediately": "즉시",
    
    # 동사 (기본)
    "go": "가다", "come": "오다", "have": "가지다", "do": "하다", "make": "만들다",
    "take": "가져가다/타다", "get": "얻다/되다", "give": "주다", "use": "사용하다",
    "know": "알다", "think": "생각하다", "see": "보다", "look": "보다", "watch": "지켜하다",
    "want": "원하다", "need": "필요하다", "like": "좋아하다", "love": "사랑하다",
    "say": "말하다", "tell": "말하다", "speak": "말하다", "talk": "이야기하다",
    "work": "일하다", "play": "놀다", "try": "시도하다", "help": "돕다",
    "start": "시작하다", "begin": "시작하다", "finish": "끝내다", "end": "끝나다",
    "stop": "멈추다", "move": "움직이다", "stay": "머무르다", "live": "살다",
    "meet": "만나다", "wait": "기다리다", "call": "부르다/전화하다", "ask": "묻다",
    "answer": "대답하다", "believe": "믿다", "understand": "이해하다", "remember": "기억하다",
    "forget": "잊다", "learn": "배우다", "study": "공부하다", "teach": "가르치다",
    "buy": "사다", "sell": "팔다", "pay": "지불하다", "spend": "쓰다(돈/시간)",
    "eat": "먹다", "drink": "마시다", "sleep": "자다", "wake": "깨다",
    "run": "달리다", "walk": "걷다", "sit": "앉다", "stand": "서다",
    "open": "열다", "close": "닫다", "read": "읽다", "write": "쓰다",
    "listen": "듣다", "hear": "듣다", "feel": "느끼다", "enjoy": "즐기다",
    
    # 동사 (중급)
    "decide": "결정하다", "plan": "계획하다", "promise": "약속하다", "suggest": "제안하다",
    "recommend": "추천하다", "advice": "조언하다", "agree": "동의하다", "refuse": "거절하다",
    "accept": "받아들이다", "expect": "기대하다", "prepare": "준비하다", "explain": "설명하다",
    "describe": "묘사하다", "discuss": "토론하다", "share": "공유하다", "join": "참여하다",
    "visit": "방문하다", "invite": "초대하다", "travel": "여행하다", "arrive": "도착하다",
    "leave": "떠나다", "enter": "들어가다", "return": "돌아오다", "follow": "따르다",
    "lead": "이끌다", "create": "창조하다", "build": "짓다", "fix": "고치다",
    "repair": "수리하다", "break": "부수다", "change": "바꾸다", "grow": "자라다",
    "become": "~이 되다", "seem": "~처럼 보이다", "appear": "나타나다", "disappear": "사라지다",
    "happen": "일어나다", "occur": "발생하다", "include": "포함하다", "exclude": "제외하다",
    "provide": "제공하다", "offer": "제안하다", "support": "지지하다", "protect": "보호하다",
    "save": "구하다/저축하다", "waste": "낭비하다", "borrow": "빌리다", "lend": "빌려주다",
    "check": "확인하다", "test": "시험하다", "guess": "추측하다", "wonder": "궁금해하다",
    "worry": "걱정하다", "hope": "희망하다", "wish": "바라다", "dream": "꿈꾸다",
    "imagine": "상상하다", "realize": "깨닫다", "notice": "알아차리다", "recognize": "인식하다",
    "focus": "집중하다", "ignore": "무시하다", "bother": "괴롭히다", "disturb": "방해하다",
    "surprise": "놀라게 하다", "scare": "무섭게 하다", "please": "기쁘게 하다", "satisfy": "만족시키다",
    "disappoint": "실망시키다", "confuse": "혼란스럽게 하다", "embarrass": "당황하게 하다",
    "celebrate": "축하하다", "congratulate": "축하하다", "apologize": "사과하다", "forgive": "용서하다",
    "appreciate": "감사하다", "respect": "존경하다", "trust": "신뢰하다", "doubt": "의심하다",
    "complain": "불평하다", "argue": "논쟁하다", "fight": "싸우다", "win": "이기다",
    "lose": "지다/잃다", "fail": "실패하다", "succeed": "성공하다", "achieve": "달성하다",
    "manage": "관리하다", "control": "통제하다", "handle": "다루다", "deal": "다루다",
    "solve": "해결하다", "resolve": "해결하다", "improve": "향상시키다", "develop": "개발하다",
    "increase": "증가하다", "decrease": "감소하다", "reduce": "줄이다", "raise": "올리다",
    "lower": "내리다", "drop": "떨어뜨리다", "pick": "고르다/줍다", "choose": "선택하다",
    "wear": "입다", "dress": "옷을 입다", "wash": "씻다", "clean": "청소하다",
    "cook": "요리하다", "bake": "굽다", "boil": "끓이다", "fry": "튀기다",
    "cut": "자르다", "slice": "썰다", "mix": "섞다", "add": "더하다",
    "pour": "붓다", "serve": "제공하다", "order": "주문하다", "reserve": "예약하다",
    "cancel": "취소하다", "delay": "미루다", "postpone": "연기하다", "hurry": "서두르다",
    "rush": "돌진하다", "miss": "놓치다/그리워하다", "catch": "잡다", "throw": "던지다",
    "hit": "치다", "kick": "차다", "push": "밀다", "pull": "당기다",
    "lift": "들어올리다", "carry": "나르다", "hold": "잡다", "touch": "만지다",
    "kiss": "키스하다", "hug": "안다", "smile": "미소짓다", "laugh": "웃다",
    "cry": "울다", "shout": "소리치다", "scream": "비명지르다", "whisper": "속삭이다",
    "sing": "노래하다", "dance": "춤추다", "draw": "그리다", "paint": "칠하다",
    
    # 형용사
    "good": "좋은", "bad": "나쁜", "great": "훌륭한", "terrible": "끔찍한",
    "happy": "행복한", "sad": "슬픈", "angry": "화난", "excited": "신난",
    "bored": "지루한", "tired": "피곤한", "busy": "바쁜", "free": "한가한/무료의",
    "easy": "쉬운", "hard": "어려운/딱딱한", "difficult": "어려운", "simple": "단순한",
    "complex": "복잡한", "complicated": "복잡한", "important": "중요한", "necessary": "필요한",
    "essential": "필수적인", "possible": "가능한", "impossible": "불가능한", "able": "할 수 있는",
    "big": "큰", "small": "작은", "large": "큰", "tiny": "아주 작은",
    "long": "긴", "short": "짧은", "high": "높은", "low": "낮은",
    "wide": "넓은", "narrow": "좁은", "deep": "깊은", "shallow": "얕은",
    "fast": "빠른", "slow": "느린", "quick": "빠른", "rapid": "신속한",
    "hot": "뜨거운", "cold": "추운", "warm": "따뜻한", "cool": "시원한",
    "new": "새로운", "old": "오래된/늙은", "young": "젊은", "modern": "현대적인",
    "traditional": "전통적인", "rich": "부유한", "poor": "가난한", "expensive": "비싼",
    "cheap": "싼", "beautiful": "아름다운", "pretty": "예쁜", "ugly": "못생긴",
    "clean": "깨끗한", "dirty": "더러운", "messy": "지저분한", "neat": "깔끔한",
    "safe": "안전한", "dangerous": "위험한", "strong": "강한", "weak": "약한",
    "healthy": "건강한", "sick": "아픈", "ill": "아픈", "painful": "고통스러운",
    "comfortable": "편안한", "uncomfortable": "불편한", "convenient": "편리한", "inconvenient": "불편한",
    "true": "사실인", "false": "거짓인", "real": "진짜의", "fake": "가짜의",
    "right": "맞는/오른쪽", "wrong": "틀린", "correct": "정확한", "incorrect": "부정확한",
    "same": "같은", "different": "다른", "similar": "비슷한", "unique": "독특한",
    "special": "특별한", "ordinary": "평범한", "normal": "정상적인", "strange": "이상한",
    "weird": "기이한", "funny": "재미있는/웃긴", "serious": "심각한/진지한", "scary": "무서운",
    "interesting": "흥미로운", "boring": "지루한", "surprising": "놀라운", "shocking": "충격적인",
    "kind": "친절한", "nice": "좋은/친절한", "mean": "비열한", "rude": "무례한",
    "polite": "공손한", "friendly": "친근한", "shy": "부끄러워하는", "confident": "자신감 있는",
    "smart": "똑똑한", "clever": "영리한", "stupid": "멍청한", "foolish": "어리석은",
    "wise": "현명한", "honest": "정직한", "dishonest": "부정직한", "lazy": "게으른",
    "diligent": "부지런한", "active": "활동적인", "passive": "수동적인", "positive": "긍정적인",
    "negative": "부정적인", "optimistic": "낙관적인", "pessimistic": "비관적인",
    "calm": "차분한", "nervous": "긴장한", "anxious": "불안한", "worried": "걱정하는",
    "proud": "자랑스러운", "ashamed": "부끄러운", "guilty": "죄책감 느끼는", "innocent": "순수한/무죄의",
    "lucky": "운 좋은", "unlucky": "운 나쁜", "famous": "유명한", "popular": "인기 있는",
    "quiet": "조용한", "loud": "시끄러운", "noisy": "시끄러운", "silent": "침묵하는",
    "bright": "밝은", "dark": "어두운", "clear": "맑은/분명한", "cloudy": "흐린",
    "dry": "마른", "wet": "젖은", "humid": "습한", "fresh": "신선한",
    "sweet": "달콤한", "sour": "신", "salty": "짠", "bitter": "쓴",
    "spicy": "매운", "hot": "매운/뜨거운", "delicious": "맛있는", "tasty": "맛있는",
    "hungry": "배고픈", "thirsty": "목마른", "full": "배부른/가득 찬", "empty": "빈",
    
    # 명사 (기본)
    "time": "시간", "year": "년", "month": "월", "week": "주", "day": "일",
    "hour": "시간", "minute": "분", "second": "초", "moment": "순간",
    "morning": "아침", "afternoon": "오후", "evening": "저녁", "night": "밤",
    "people": "사람들", "person": "사람", "man": "남자", "woman": "여자",
    "child": "아이", "boy": "소년", "girl": "소녀", "baby": "아기",
    "family": "가족", "parent": "부모", "father": "아버지", "mother": "어머니",
    "son": "아들", "daughter": "딸", "brother": "형제", "sister": "자매",
    "friend": "친구", "colleague": "동료", "neighbor": "이웃", "guest": "손님",
    "job": "직업", "work": "일", "business": "사업", "company": "회사",
    "office": "사무실", "meeting": "회의", "project": "프로젝트", "report": "보고서",
    "student": "학생", "teacher": "선생님", "school": "학교", "class": "수업",
    "homework": "숙제", "exam": "시험", "grade": "성적", "university": "대학교",
    "house": "집", "home": "가정", "room": "방", "kitchen": "부엌",
    "bathroom": "화장실", "bedroom": "침실", "living": "거실", "garden": "정원",
    "city": "도시", "town": "마을", "country": "나라", "world": "세계",
    "place": "장소", "area": "지역", "space": "공간", "location": "위치",
    "food": "음식", "water": "물", "coffee": "커피", "tea": "차",
    "bread": "빵", "rice": "밥/쌀", "meat": "고기", "fruit": "과일",
    "vegetable": "채소", "meal": "식사", "breakfast": "아침식사", "lunch": "점심식사",
    "dinner": "저녁식사", "snack": "간식", "dessert": "디저트", "restaurant": "식당",
    "money": "돈", "cash": "현금", "card": "카드", "price": "가격",
    "cost": "비용", "bill": "청구서", "wallet": "지갑", "bank": "은행",
    "car": "자동차", "bus": "버스", "train": "기차", "subway": "지하철",
    "taxi": "택시", "plane": "비행기", "bicycle": "자전거", "bike": "자전거",
    "road": "길", "street": "거리", "traffic": "교통", "station": "역",
    "airport": "공항", "ticket": "표", "trip": "여행", "vacation": "휴가",
    "book": "책", "paper": "종이", "pen": "펜", "pencil": "연필",
    "computer": "컴퓨터", "phone": "전화기", "internet": "인터넷", "email": "이메일",
    "message": "메시지", "news": "뉴스", "movie": "영화", "music": "음악",
    "song": "노래", "picture": "사진/그림", "camera": "카메라", "game": "게임",
    "sport": "스포츠", "health": "건강", "body": "몸", "head": "머리",
    "eye": "눈", "ear": "귀", "nose": "코", "mouth": "입",
    "hand": "손", "foot": "발", "arm": "팔", "leg": "다리",
    "heart": "심장/마음", "mind": "마음/정신", "idea": "아이디어", "thought": "생각",
    "problem": "문제", "solution": "해결책", "question": "질문", "answer": "대답",
    "reason": "이유", "result": "결과", "fact": "사실", "truth": "진실",
    "story": "이야기", "word": "단어", "sentence": "문장", "language": "언어",
    "thing": "것", "stuff": "물건", "part": "부분", "piece": "조각",
    "kind": "종류", "type": "유형", "way": "방법/길", "side": "측면/쪽",
    "life": "인생/삶", "death": "죽음", "love": "사랑", "hope": "희망",
    "dream": "꿈", "peace": "평화", "war": "전쟁", "nature": "자연",
    "weather": "날씨", "sun": "해", "moon": "달", "star": "별",
    "sky": "하늘", "cloud": "구름", "rain": "비", "snow": "눈",
    "wind": "바람", "air": "공기", "fire": "불", "water": "물",
    "earth": "지구/땅", "sea": "바다", "river": "강", "mountain": "산",
    "tree": "나무", "flower": "꽃", "animal": "동물", "dog": "개",
    "cat": "고양이", "bird": "새", "fish": "물고기",
    
    # 기타
    "something": "무언가", "anything": "무엇이든", "nothing": "아무것도 아님", "everything": "모든 것",
    "someone": "누군가", "anyone": "누구든", "noone": "아무도 아님", "everyone": "모두",
    "somewhere": "어딘가", "anywhere": "어디든", "nowhere": "아무데도 아님", "everywhere": "모든 곳",
    "maybe": "아마도", "perhaps": "아마도", "please": "제발/부디", "sorry": "미안한",
    "thanks": "고마움", "hello": "안녕", "bye": "안녕(작별)", "okay": "좋아",
    "yes": "네", "no": "아니요", "not": "아님",
    
    # 추가 단어 (패턴 영어 특화)
    "grab": "잡다/먹다", "hang": "걸다/놀다", "out": "밖에", "shift": "교대근무",
    "bungee": "번지", "jumping": "점프", "upcoming": "다가오는", "deadline": "마감일",
    "aging": "노화", "meaningless": "의미없는", "anniversary": "기념일", "harshly": "거칠게",
    "presentation": "발표", "split": "나누다", "approach": "접근", "briefly": "간단히",
    "available": "가능한", "reschedule": "일정변경", "formal": "격식있는", "scenic": "경치좋은",
    "extend": "연장하다", "reasonable": "합리적인", "entirely": "전적으로", "promising": "유망한",
    "outdated": "구식의", "talent": "재능", "homemade": "수제", "iced": "얼음넣은",
    "bold": "대담한", "proper": "적절한", "harsh": "가혹한", "reliable": "믿을만한",
    "unusually": "유난히", "refreshing": "상쾌한", "revised": "개정된", "backup": "예비",
    "double-check": "재확인하다", "motivation": "동기부여", "rebuild": "재건하다", "original": "원래의",
    "previous": "이전의", "authentic": "진정한", "expectation": "기대", "portable": "휴대용",
    "hastily": "급히", "spontaneous": "즉흥적인", "overanalyze": "과잉분석", "procrastinate": "미루다",
    "unconsciously": "무의식적으로", "awkward": "어색한", "valuable": "가치있는", "preference": "선호",
    "excessive": "과도한", "cautious": "신중한", "fluent": "유창한", "frequently": "자주",
    "embarrassing": "당황스러운", "submit": "제출하다", "urgent": "긴급한", "cozy": "아늑한",
    "novel": "소설", "publicly": "공개적으로", "regularly": "정기적으로", "gradually": "점차",
    "pressure": "압박", "independently": "독립적으로", "cluttered": "어수선한", "exactly": "정확히",
    "extremely": "극도로", "warranty": "보증", "sample": "견본", "updates": "업데이트",
    "grandmother": "할머니", "grandfather": "할아버지", "peacefully": "평화롭게",
    "delivery": "배달", "younger": "더 젊은", "older": "더 나이 든",
    "groceries": "식료품", "charge": "충전하다/청구하다", "nearest": "가장 가까운",
    "pronounce": "발음하다", "recipe": "조리법", "ingredient": "재료",
    "direction": "방향", "straight": "곧은/똑바로", "corner": "모퉁이",
    "traffic": "교통", "jam": "잼/막힘", "subway": "지하철", "station": "역",
    "transfer": "환승하다", "exit": "출구", "entrance": "입구",
    "crowded": "붐비는", "seat": "좌석", "stand": "서다",
    "weather": "날씨", "forecast": "예보", "sunny": "맑은", "rainy": "비오는",
    "windy": "바람부는", "snowy": "눈오는", "cloudy": "흐린",
    "temperature": "온도", "degree": "도", "umbrella": "우산",
    "coat": "코트", "jacket": "재킷", "scarf": "목도리", "gloves": "장갑",
    "boots": "부츠", "sneakers": "운동화", "shoes": "신발",
    "shirt": "셔츠", "pants": "바지", "skirt": "치마", "dress": "원피스",
    "size": "크기", "color": "색깔", "style": "스타일", "fashion": "패션",
    "price": "가격", "discount": "할인", "sale": "판매/세일", "receipt": "영수증",
    "refund": "환불", "exchange": "교환", "cashier": "계산원",
    "customer": "손님", "service": "서비스", "tip": "팁/조언",
    "menu": "메뉴", "order": "주문하다", "waiter": "웨이터", "waitress": "웨이트리스",
    "chef": "요리사", "cook": "요리하다", "taste": "맛보다",
    "spicy": "매운", "salty": "짠", "sweet": "달콤한", "sour": "신",
    "bitter": "쓴", "delicious": "맛있는", "yummy": "맛있는",
    "hungry": "배고픈", "thirsty": "목마른", "full": "배부른",
    "diet": "다이어트/식단", "exercise": "운동하다", "gym": "체육관",
    "yoga": "요가", "jogging": "조깅", "swimming": "수영",
    "health": "건강", "body": "몸", "weight": "무게", "height": "키",
    "doctor": "의사", "nurse": "간호사", "hospital": "병원", "pharmacy": "약국",
    "medicine": "약", "pill": "알약", "cold": "감기", "fever": "열",
    "headache": "두통", "stomachache": "복통", "toothache": "치통",
    "pain": "고통", "hurt": "다치다", "sick": "아픈", "well": "건강한/잘",
    "tired": "피곤한", "sleepy": "졸린", "exhausted": "지친",
    "stress": "스트레스", "relax": "쉬다", "rest": "휴식",
    "vacation": "휴가", "holiday": "휴일", "trip": "여행", "travel": "여행하다",
    "flight": "비행", "hotel": "호텔", "reservation": "예약",
    "passport": "여권", "visa": "비자", "luggage": "짐", "baggage": "수하물",
    "check-in": "체크인", "check-out": "체크아웃", "guide": "가이드",
    "tour": "투어", "sightseeing": "관광", "souvenir": "기념품",
    "photo": "사진", "camera": "카메라", "video": "비디오",
    "movie": "영화", "cinema": "영화관", "ticket": "표",
    "music": "음악", "concert": "콘서트", "song": "노래", "singer": "가수",
    "book": "책", "library": "도서관", "read": "읽다", "write": "쓰다",
    "study": "공부하다", "learn": "배우다", "teach": "가르치다",
    "school": "학교", "student": "학생", "teacher": "선생님",
    "class": "수업", "lesson": "레슨", "homework": "숙제", "test": "시험",
    "exam": "시험", "grade": "성적", "pass": "통과하다", "fail": "실패하다",
    "job": "직업", "work": "일", "office": "사무실", "company": "회사",
    "boss": "상사", "colleague": "동료", "meeting": "회의",
    "project": "프로젝트", "report": "보고서", "presentation": "발표",
    "email": "이메일", "call": "전화하다", "message": "메시지",
    "computer": "컴퓨터", "laptop": "노트북", "internet": "인터넷",
    "website": "웹사이트", "app": "앱", "phone": "전화기",
    "battery": "배터리", "charger": "충전기", "wifi": "와이파이",
    "password": "비밀번호", "login": "로그인", "logout": "로그아웃",
    "account": "계정", "profile": "프로필", "friend": "친구",
    "family": "가족", "parents": "부모님", "children": "아이들",
    "husband": "남편", "wife": "아내", "son": "아들", "daughter": "딸",
    "brother": "형제", "sister": "자매", "uncle": "삼촌", "aunt": "이모/고모",
    "cousin": "사촌", "nephew": "조카(남)", "niece": "조카(여)",
    "neighbor": "이웃", "guest": "손님", "stranger": "낯선 사람",
    "love": "사랑", "like": "좋아하다", "hate": "싫어하다",
    "happy": "행복한", "sad": "슬픈", "angry": "화난",
    "excited": "신난", "bored": "지루한", "scared": "무서운",
    "surprised": "놀란", "worried": "걱정하는", "nervous": "긴장한",
    "proud": "자랑스러운", "shy": "부끄러운", "sorry": "미안한",
    "thanks": "고마운", "please": "제발", "maybe": "아마도",
    "really": "정말", "very": "매우", "too": "너무",
    "so": "그래서/너무", "because": "왜냐하면", "but": "하지만",
    "and": "그리고", "or": "또는", "if": "만약",
    "when": "언제", "where": "어디서", "who": "누구",
    "what": "무엇", "why": "왜", "how": "어떻게",
    "which": "어느", "this": "이것", "that": "저것",
    "here": "여기", "there": "거기", "now": "지금",
    "then": "그때", "today": "오늘", "tomorrow": "내일",
    "yesterday": "어제", "always": "항상", "never": "결코",
    "sometimes": "가끔", "often": "종종", "usually": "보통"
}

def update_meanings():
    path = r'c:\Users\dbghkvud123\Desktop\사프\영어\콩단\data\patterns.json'
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("파일을 찾을 수 없습니다.")
        return

    updated_count = 0
    missing_words = []

    for day in data['days']:
        if 'vocabulary' in day:
            for vocab in day['vocabulary']:
                word = vocab['word'].lower()
                # 구두점 제거
                word = word.replace('.', '').replace(',', '').replace('?', '').replace('!', '')
                
                if word in VOCAB_DICT:
                    vocab['meaning'] = VOCAB_DICT[word]
                    updated_count += 1
                else:
                    # 사전에 없으면 기본형으로 시도 (s, ed, ing 제거)
                    base_word = word
                    if word.endswith('s') and word[:-1] in VOCAB_DICT: base_word = word[:-1]
                    elif word.endswith('ed') and word[:-2] in VOCAB_DICT: base_word = word[:-2]
                    elif word.endswith('ing') and word[:-3] in VOCAB_DICT: base_word = word[:-3]
                    elif word.endswith('ly') and word[:-2] in VOCAB_DICT: base_word = word[:-2]
                    
                    if base_word in VOCAB_DICT:
                        vocab['meaning'] = VOCAB_DICT[base_word]
                        updated_count += 1
                    else:
                        missing_words.append(word)
                        # 임시 뜻 유지 또는 '뜻 검색 필요'로 변경
                        # vocab['meaning'] = "뜻 검색 필요" 

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # data.js 업데이트
    js_path = r'c:\Users\dbghkvud123\Desktop\사프\영어\콩단\docs\js\data.js'
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(f"const PATTERNS_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};")

    print(f"✅ 단어 뜻 업데이트 완료! (총 {updated_count}개)")
    if missing_words:
        print(f"⚠️ 사전에 없는 단어 ({len(missing_words)}개): {', '.join(missing_words[:10])}...")

if __name__ == "__main__":
    update_meanings()
