import urllib.request
import urllib.parse
import json
import ssl

url = 'https://query.wikidata.org/sparql'

query = """
SELECT DISTINCT ?engLabel ?thaiLabel WHERE {
  { ?item wdt:p31/wdt:subClassOf* wd:Q12140 . }
  UNION
  { ?item wdt:p31/wdt:subClassOf* wd:Q11173 . }
  ?item rdfs:label ?engLabel .
  FILTER (lang(?engLabel) = "en")
  ?item rdfs:label ?thaiLabel .
  FILTER (lang(?thaiLabel) = "th")
}
LIMIT 2000
"""

params = {
    'format': 'json',
    'query': query
}

req_url = url + '?' + urllib.parse.urlencode(params)

req = urllib.request.Request(
    req_url,
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/sparql-results+json'
    }
)

# Avoid SSL context errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    print("Sending SPARQL query to Wikidata using urllib...")
    with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
        res_data = response.read().decode('utf-8')
        data = json.loads(res_data)
        
        results = data.get('results', {}).get('bindings', [])
        print(f"Successfully retrieved {len(results)} mappings!")
        
        mapping = {}
        for r in results:
            eng = r['engLabel']['value'].lower()
            thai = r['thaiLabel']['value']
            # Skip labels with non-drug terms or very long names
            if len(eng) > 40 or len(thai) > 40:
                continue
            # Avoid duplicate english keys
            if eng not in mapping:
                mapping[eng] = []
            if thai not in mapping[eng]:
                mapping[eng].append(thai)
                
        print("\nSample Mappings (First 30):")
        sample_keys = list(mapping.keys())[:30]
        for k in sample_keys:
            print(f"  {k}: {mapping[k]}")
            
        # Save to a json file
        with open('wikidata_thai_drugs.json', 'w', encoding='utf-8') as f:
            json.dump(mapping, f, ensure_ascii=False, indent=2)
        print("\nSaved all mappings to 'wikidata_thai_drugs.json'")
        
except Exception as e:
    print("Error:", e)
