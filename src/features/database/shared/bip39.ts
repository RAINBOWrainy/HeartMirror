/**
 * BIP-39 Mnemonic Phrase Generation and Verification
 * Standard 12-word recovery phrases for secure password backup
 * Uses PBKDF2 with 2048 rounds to derive seed from mnemonic
 */
import { pbkdf2Sync, randomBytes, createHash, timingSafeEqual } from 'crypto';

// BIP-39 English wordlist (2048 words)
const WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
  'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
  'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
  'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'apply', 'appoint',
  'approach', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue',
  'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive',
  'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'asleep', 'aspect',
  'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack',
  'attend', 'attitude', 'attorney', 'attract', 'auction', 'audit', 'august', 'aunt',
  'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware',
  'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon',
  'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner',
  'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle',
  'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin',
  'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best',
  'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'big', 'bike',
  'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame',
  'blanket', 'blast', 'bleak', 'blend', 'bless', 'blind', 'blood', 'blossom',
  'blouse', 'blow', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
  'boil', 'bold', 'bolt', 'bomb', 'bone', 'bonus', 'book', 'boost',
  'border', 'boring', 'borrow', 'boss', 'both', 'bottle', 'bottom', 'bounce',
  'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread',
  'break', 'breast', 'breathe', 'brick', 'bridge', 'brief', 'bright', 'bring',
  'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush',
  'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet',
  'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy',
  'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage',
  'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel',
  'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'cap', 'capital', 'captain',
  'capture', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carrot', 'carry',
  'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog',
  'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling',
  'celery', 'cement', 'cemetery', 'cent', 'center', 'cereal', 'certain', 'chair',
  'chalk', 'champion', 'change', 'chaos', 'chapter', 'charge', 'chase', 'chat',
  'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken', 'chief',
  'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk', 'churn',
  'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil', 'claim', 'clamp',
  'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click', 'client',
  'cliff', 'climb', 'clinic', 'clip', 'clock', 'clog', 'close', 'cloth',
  'cloud', 'club', 'clue', 'cluster', 'coach', 'coast', 'coconut', 'code',
  'coffee', 'coil', 'coin', 'cold', 'collar', 'color', 'column', 'combine',
  'come', 'comfort', 'comic', 'common', 'company', 'concert', 'conduct', 'confirm',
  'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper',
  'copy', 'coral', 'core', 'corn', 'corner', 'correct', 'cost', 'cotton',
  'couch', 'country', 'cover', 'cow', 'crack', 'cradle', 'craft', 'cram',
  'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'create', 'creek',
  'crew', 'cricket', 'cry', 'crystal', 'cube', 'cupboard', 'cup', 'curious',
  'current', 'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'cylinder',
  'dad', 'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter',
  'dawn', 'day', 'deal', 'debate', 'debris', 'decade', 'december', 'decide',
  'declare', 'decline', 'decorate', 'decrease', 'deer', 'defense', 'define', 'defy',
  'degree', 'delay', 'deliver', 'demand', 'demise', 'demo', 'denial', 'dentist',
  'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive', 'describe',
  'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect', 'develop',
  'device', 'devil', 'devise', 'diagram', 'dial', 'diamond', 'diary', 'dice',
  'diesel', 'diet', 'differ', 'digit', 'dignity', 'dilemma', 'dinner', 'dinosaur',
  'direct', 'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss', 'disorder',
  'display', 'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document',
  'dog', 'doll', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose',
  'double', 'dove', 'draft', 'dragon', 'drain', 'drama', 'drastic', 'draw',
  'dream', 'dress', 'drift', 'drill', 'drink', 'drip', 'drive', 'drop',
  'drum', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch',
  'duty', 'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth',
  'easily', 'east', 'easy', 'echo', 'ecology', 'economy', 'edge', 'edit',
  'educate', 'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric',
  'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark', 'embody',
  'embrace', 'emerge', 'emotion', 'employ', 'empower', 'empty', 'enable', 'enact',
  'end', 'endless', 'endorse', 'enemy', 'energy', 'enforce', 'engage', 'engine',
  'enhance', 'enjoy', 'enlist', 'enough', 'enrich', 'enroll', 'ensure', 'enter',
  'entire', 'entry', 'envelope', 'environment', 'equal', 'equip', 'erase', 'erode',
  'erosion', 'error', 'erupt', 'escape', 'essay', 'essence', 'estate', 'eternal',
  'ethics', 'evidence', 'evil', 'evolve', 'exact', 'example', 'excess', 'exchange',
  'excite', 'exclude', 'execute', 'exercise', 'exert', 'exhaust', 'exhibit', 'exile',
  'exist', 'exit', 'exotic', 'expand', 'expect', 'expire', 'explain', 'expose',
  'express', 'extend', 'extra', 'eye', 'eyebrow', 'fabric', 'face', 'fact',
  'factor', 'factory', 'fade', 'faint', 'fair', 'fall', 'false', 'fame',
  'family', 'fan', 'fancy', 'fantasy', 'farm', 'fashion', 'fast', 'fat',
  'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal', 'fee',
  'feed', 'feedback', 'feel', 'female', 'fence', 'festival', 'fetch', 'fever',
  'few', 'fiber', 'fiction', 'field', 'fierce', 'fifteen', 'fifth', 'fifty',
  'fight', 'figure', 'file', 'film', 'filter', 'final', 'find', 'fine',
  'finger', 'finish', 'fire', 'firm', 'first', 'fish', 'fitness', 'five',
  'fix', 'flag', 'flame', 'flat', 'flavor', 'flee', 'flight', 'flip',
  'float', 'flock', 'floor', 'flower', 'fluid', 'flush', 'fly', 'foam',
  'focus', 'fog', 'fold', 'follow', 'food', 'foot', 'force', 'forest',
  'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found',
  'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog',
  'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel', 'fun', 'function',
  'fund', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy',
  'gallery', 'game', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas',
  'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius', 'genre',
  'gentle', 'genuine', 'geography', 'geometry', 'germ', 'gesture', 'ghost', 'giant',
  'gift', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass',
  'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue',
  'goat', 'goddess', 'gold', 'good', 'goose', 'govern', 'gown', 'grab',
  'grace', 'grade', 'grain', 'grant', 'grape', 'grass', 'gravity', 'great',
  'green', 'grid', 'grief', 'grill', 'grocery', 'group', 'grow', 'grunt',
  'guard', 'guess', 'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit',
  'hair', 'half', 'hammer', 'hamster', 'hand', 'happy', 'harbor', 'hard',
  'harsh', 'harvest', 'hat', 'have', 'hawk', 'hay', 'heal', 'health',
  'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen',
  'hero', 'hidden', 'high', 'hill', 'hint', 'hip', 'hire', 'history',
  'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow', 'home', 'honey',
  'hood', 'hope', 'horn', 'horror', 'horse', 'hospital', 'host', 'hotel',
  'hour', 'house', 'hover', 'hub', 'huge', 'human', 'humble', 'humor',
  'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid',
  'ice', 'icon', 'idea', 'identify', 'idle', 'ignore', 'ill', 'illegal',
  'illness', 'image', 'imitate', 'immense', 'immune', 'impact', 'impose', 'improve',
  'impulse', 'inch', 'include', 'income', 'increase', 'index', 'indicate', 'indoor',
  'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject',
  'injury', 'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect',
  'inside', 'inspire', 'install', 'intact', 'interest', 'into', 'invest', 'invite',
  'involve', 'iron', 'island', 'isolate', 'issue', 'item', 'ivory', 'jacket',
  'jaguar', 'jar', 'jaw', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel',
  'job', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump',
  'jungle', 'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup',
  'key', 'kick', 'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit',
  'kitchen', 'kite', 'kitten', 'kiwi', 'knee', 'knife', 'knock', 'know',
  'lab', 'label', 'labor', 'ladder', 'lady', 'lake', 'lamp', 'language',
  'laptop', 'large', 'later', 'latin', 'laugh', 'laundry', 'lava', 'law',
  'lawn', 'lawsuit', 'layer', 'lazy', 'leader', 'leaf', 'learn', 'least',
  'leave', 'lecture', 'left', 'leg', 'legal', 'legend', 'leisure', 'lemon',
  'lend', 'length', 'lens', 'leopard', 'lesson', 'letter', 'level', 'liar',
  'liberty', 'library', 'license', 'life', 'lift', 'light', 'like', 'limb',
  'limit', 'link', 'lion', 'liquid', 'list', 'little', 'live', 'lizard',
  'load', 'loan', 'lobster', 'local', 'lock', 'logic', 'lonely', 'long',
  'loop', 'lottery', 'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage',
  'lumber', 'lunar', 'lunch', 'luxury', 'lyrics', 'machine', 'mad', 'magic',
  'magnet', 'maid', 'mail', 'main', 'major', 'make', 'mammal', 'man',
  'manage', 'mandate', 'mango', 'mansion', 'manual', 'maple', 'marble', 'march',
  'margin', 'marine', 'market', 'marriage', 'mask', 'mass', 'master', 'match',
  'material', 'math', 'matrix', 'matter', 'maximum', 'maze', 'meadow', 'mean',
  'measure', 'meat', 'mechanic', 'medal', 'media', 'melody', 'melt', 'member',
  'memory', 'mention', 'menu', 'mercy', 'merge', 'merit', 'merry', 'mesh',
  'message', 'metal', 'method', 'middle', 'midnight', 'milk', 'million', 'mimic',
  'mind', 'minimum', 'minor', 'minute', 'miracle', 'mirror', 'misery', 'miss',
  'mistake', 'mix', 'mixed', 'mixture', 'mobile', 'mode', 'model', 'modify',
  'mom', 'moment', 'monitor', 'monkey', 'monster', 'month', 'moon', 'moral',
  'more', 'morning', 'mosquito', 'mother', 'motion', 'motor', 'mountain', 'mouse',
  'move', 'movie', 'much', 'muffin', 'mule', 'multiply', 'muscle', 'museum',
  'mushroom', 'music', 'must', 'mutant', 'mutual', 'myself', 'mystery', 'myth',
  'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation', 'nature', 'near',
  'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'nest',
  'net', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night',
  'noble', 'noise', 'nominee', 'noodle', 'normal', 'north', 'nose', 'notable',
  'note', 'nothing', 'notice', 'novel', 'now', 'nuclear', 'nude', 'number',
  'nurse', 'nut', 'oak', 'oath', 'obey', 'object', 'oblige', 'obscure',
  'observe', 'obtain', 'obvious', 'occur', 'ocean', 'october', 'odd', 'odor',
  'off', 'offer', 'office', 'often', 'oil', 'okay', 'old', 'olive',
  'olympic', 'omit', 'once', 'one', 'onion', 'online', 'only', 'open',
  'opera', 'opinion', 'oppose', 'option', 'orange', 'orbit', 'orchard', 'order',
  'ordinary', 'organ', 'orient', 'original', 'orphan', 'ostrich', 'other', 'outdoor',
  'outer', 'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner',
  'oxygen', 'oyster', 'ozone', 'pact', 'paddle', 'page', 'pair', 'palace',
  'palm', 'panda', 'panel', 'panic', 'panther', 'paper', 'parade', 'parent',
  'park', 'parrot', 'part', 'party', 'pass', 'patch', 'path', 'patient',
  'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace', 'peanut', 'pear',
  'peasant', 'pelican', 'pen', 'penalty', 'pencil', 'people', 'pepper', 'perfect',
  'permit', 'person', 'pet', 'phone', 'photo', 'phrase', 'physical', 'piano',
  'pick', 'picture', 'pie', 'piece', 'pig', 'pigeon', 'pill', 'pilot',
  'pin', 'pine', 'pink', 'pioneer', 'pipe', 'pirate', 'pistol', 'pitch',
  'pizza', 'place', 'planet', 'plastic', 'plate', 'play', 'please', 'pledge',
  'pluck', 'plug', 'plus', 'pocket', 'poem', 'poet', 'point', 'poison',
  'polar', 'pole', 'police', 'pond', 'pony', 'pool', 'popular', 'portion',
  'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power',
  'practice', 'praise', 'pray', 'preach', 'precede', 'premium', 'prepare', 'present',
  'president', 'press', 'price', 'pride', 'primary', 'print', 'priority', 'prison',
  'private', 'prize', 'problem', 'process', 'produce', 'profit', 'program', 'project',
  'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'prove', 'provide',
  'public', 'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch', 'pupil',
  'puppy', 'purchase', 'purity', 'purpose', 'purse', 'push', 'put', 'puzzle',
  'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quiet', 'quilt',
  'quota', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio',
  'rail', 'rain', 'raise', 'rally', 'ram', 'ramp', 'ranch', 'random',
  'range', 'rapid', 'rare', 'rate', 'rather', 'raven', 'raw', 'razor',
  'ready', 'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe',
  'record', 'recycle', 'reduce', 'reflect', 'reform', 'refuse', 'region', 'regret',
  'regular', 'relate', 'relax', 'release', 'relief', 'rely', 'remain', 'remember',
  'remind', 'remove', 'render', 'renew', 'rent', 'reopen', 'repair', 'repeat',
  'replace', 'report', 'require', 'rescue', 'resemble', 'resist', 'resort', 'resource',
  'response', 'result', 'retire', 'retreat', 'return', 'reunion', 'reveal', 'review',
  'reward', 'rhythm', 'rib', 'ribbon', 'rice', 'rich', 'ride', 'ridge',
  'rifle', 'right', 'rigid', 'ring', 'riot', 'ripple', 'rise', 'risk',
  'ritual', 'rival', 'river', 'road', 'roast', 'robot', 'robust', 'rocket',
  'romance', 'roof', 'rookie', 'room', 'rose', 'rotate', 'rough', 'round',
  'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway',
  'rural', 'sad', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt',
  'salute', 'same', 'sample', 'sand', 'satisfy', 'satoshi', 'sauce', 'sausage',
  'save', 'say', 'scale', 'scan', 'scare', 'scatter', 'scene', 'scheme',
  'school', 'science', 'scissors', 'scorpion', 'scout', 'scrap', 'screen', 'screw',
  'script', 'scrub', 'sea', 'search', 'season', 'seat', 'second', 'secret',
  'section', 'security', 'seed', 'seek', 'segment', 'select', 'sell', 'seminar',
  'senior', 'sense', 'sentence', 'series', 'service', 'session', 'settle', 'seven',
  'shadow', 'shaft', 'shallow', 'share', 'shark', 'sharp', 'sheep', 'sheet',
  'shelf', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship', 'shirt',
  'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp',
  'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight',
  'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since',
  'sing', 'siren', 'sister', 'situate', 'six', 'size', 'skate', 'sketch',
  'ski', 'skill', 'skin', 'skip', 'skull', 'slab', 'slam', 'sleep',
  'slender', 'slice', 'slide', 'slight', 'slim', 'slogan', 'slot', 'slow',
  'slug', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack',
  'snake', 'snap', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda',
  'soft', 'solar', 'soldier', 'solid', 'solution', 'solve', 'someone', 'song',
  'soon', 'sort', 'soul', 'sound', 'soup', 'source', 'south', 'space',
  'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell', 'spend',
  'sphere', 'spice', 'spider', 'spike', 'spin', 'spirit', 'spit', 'spite',
  'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray', 'spread',
  'spring', 'spy', 'square', 'stage', 'stair', 'stamp', 'stand', 'start',
  'state', 'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick',
  'still', 'sting', 'stock', 'stomach', 'stone', 'stool', 'story', 'stove',
  'straight', 'strange', 'street', 'strike', 'strong', 'struggle', 'student', 'study',
  'stuff', 'stupid', 'style', 'subject', 'submit', 'subway', 'success', 'such',
  'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'sum', 'summer', 'sun',
  'sunny', 'sunset', 'super', 'supply', 'supreme', 'sure', 'surface', 'surge',
  'surprise', 'surround', 'survey', 'suspect', 'swallow', 'swamp', 'swap', 'swarm',
  'swear', 'sweet', 'swift', 'swim', 'swing', 'switch', 'sword', 'symbol',
  'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail', 'take',
  'tale', 'talk', 'tall', 'tank', 'tape', 'target', 'task', 'taste',
  'tattoo', 'taxi', 'teach', 'team', 'tell', 'ten', 'tenant', 'tennis',
  'tent', 'term', 'test', 'text', 'thank', 'that', 'theme', 'then',
  'theory', 'there', 'they', 'thing', 'this', 'thought', 'three', 'thrive',
  'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber',
  'time', 'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco',
  'today', 'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow',
  'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'torch',
  'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower', 'town',
  'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap',
  'trash', 'travel', 'tray', 'tree', 'tremble', 'trend', 'trial', 'tribe',
  'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true',
  'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition', 'tumble',
  'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve', 'twenty', 'twice',
  'two', 'type', 'typical', 'ugly', 'umbrella', 'unable', 'unaware', 'uncle',
  'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy', 'uniform', 'unique',
  'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update',
  'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban', 'urge', 'usage',
  'use', 'used', 'useful', 'useless', 'usual', 'utility', 'vacant', 'vacuum',
  'vague', 'valley', 'valve', 'van', 'vanish', 'vapor', 'various', 'vast',
  'vault', 'vehicle', 'velvet', 'vendor', 'venture', 'venue', 'verb', 'verify',
  'version', 'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video',
  'view', 'village', 'visit', 'vital', 'vivid', 'voice', 'void', 'volcano',
  'volume', 'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall',
  'walnut', 'want', 'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste',
  'water', 'wave', 'way', 'wealth', 'weapon', 'wear', 'weasel', 'weather',
  'web', 'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet', 'whale',
  'what', 'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide',
  'width', 'wife', 'wild', 'will', 'win', 'window', 'wine', 'wing',
  'winner', 'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf',
  'woman', 'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry',
  'worth', 'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard',
  'year', 'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo'
];

const BIP39_SALT_PREFIX = 'mnemonic';

/**
 * Generate 12 random bytes (128 bits of entropy)
 */
export function generateEntropy(): Buffer {
  return randomBytes(16); // 128 bits = 12 words
}

/**
 * Calculate BIP-39 checksum bits
 * For 128 bits entropy: checksum = first 4 bits of SHA256(entropy)
 */
export function calculateChecksum(entropy: Buffer): number {
  const hash = createHash('sha256').update(entropy).digest();
  return hash[0] >> 4; // First 4 bits
}

/**
 * Generate a 12-word BIP-39 mnemonic phrase
 */
export function generateMnemonic(): string {
  const entropy = generateEntropy();
  return entropyToMnemonic(entropy);
}

/**
 * Convert entropy buffer to 12-word mnemonic phrase
 */
export function entropyToMnemonic(entropy: Buffer): string {
  if (entropy.length !== 16) {
    throw new Error('Entropy must be 16 bytes (128 bits) for 12 words');
  }

  const checksum = calculateChecksum(entropy);

  // Convert entropy + checksum to 11-bit word indices
  // 128 bits + 4 bits = 132 bits = 12 * 11 bits
  const bits: boolean[] = [];

  for (let i = 0; i < entropy.length; i++) {
    for (let j = 7; j >= 0; j--) {
      bits.push(((entropy[i] >> j) & 1) === 1);
    }
  }

  // Add 4 checksum bits
  for (let j = 3; j >= 0; j--) {
    bits.push(((checksum >> j) & 1) === 1);
  }

  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    let index = 0;
    for (let j = 0; j < 11; j++) {
      index = (index << 1) | (bits[i * 11 + j] ? 1 : 0);
    }
    words.push(WORDLIST[index]);
  }

  return words.join(' ');
}

/**
 * Validate a mnemonic phrase (check word validity and checksum)
 */
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);

  if (words.length !== 12) {
    return false;
  }

  // All words must be in the wordlist
  for (const word of words) {
    if (!WORDLIST.includes(word)) {
      return false;
    }
  }

  // Convert words back to bits and verify checksum
  const bits: boolean[] = [];

  for (const word of words) {
    const index = WORDLIST.indexOf(word);
    for (let j = 10; j >= 0; j--) {
      bits.push(((index >> j) & 1) === 1);
    }
  }

  // First 128 bits are entropy, last 4 bits are checksum
  const entropyBits = bits.slice(0, 128);
  const checksumBits = bits.slice(128, 132);

  // Reconstruct entropy buffer
  const entropy = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (entropyBits[i * 8 + j] ? 1 : 0);
    }
    entropy[i] = byte;
  }

  // Verify checksum
  const expectedChecksum = calculateChecksum(entropy);
  let actualChecksum = 0;
  for (let j = 0; j < 4; j++) {
    actualChecksum = (actualChecksum << 1) | (checksumBits[j] ? 1 : 0);
  }

  return timingSafeEqual(
    Buffer.from([expectedChecksum]),
    Buffer.from([actualChecksum])
  );
}

/**
 * Derive a seed from mnemonic phrase using PBKDF2
 * BIP-39 standard: 2048 rounds, HMAC-SHA512
 */
export function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Buffer {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const salt = BIP39_SALT_PREFIX + passphrase;
  return pbkdf2Sync(mnemonic.normalize('NFKD'), salt.normalize('NFKD'), 2048, 64, 'sha512');
}

/**
 * Derive an encryption key from mnemonic phrase
 * Returns a 32-byte key suitable for AES-256
 */
export function mnemonicToKey(mnemonic: string): Buffer {
  const seed = mnemonicToSeed(mnemonic);
  return seed.slice(0, 32); // Use first 256 bits as key
}

/**
 * Generate a recovery code QR-friendly format
 * Returns 3 groups of 4 words for easy entry
 */
export function formatRecoveryPhrase(mnemonic: string): string[] {
  const words = mnemonic.trim().split(/\s+/);
  if (words.length !== 12) {
    throw new Error('Mnemonic must be 12 words');
  }

  return [
    words.slice(0, 4).join(' '),
    words.slice(4, 8).join(' '),
    words.slice(8, 12).join(' '),
  ];
}
