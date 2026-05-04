import sqlite3

def verify_output():
    try:
        conn = sqlite3.connect('maestro.db')
        cursor = conn.cursor()
        cursor.execute("SELECT content_draft, status FROM city_data WHERE city='Valencia' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        
        if row:
            content = str(row[0])
            print("\n=== STATUS ===")
            print(row[1])
            print("\n=== VERIFICATION ===")
            print(f"Word Count: {len(content.split())}")
            print(f"H3 count (Casos Reales?): {content.count('<h3>')}")
            hasLocksmith = '"@type":"Locksmith"' in content or '"@type": "Locksmith"' in content
            print(f"Schema Locksmith?: {'Yes' if hasLocksmith else 'No'}")
            
            hasLocalBusiness = '"@type":"LocalBusiness"' in content or '"@type": "LocalBusiness"' in content
            print(f"Schema LocalBusiness?: {'Yes' if hasLocalBusiness else 'No'}")
            
            hasFAQPage = '"@type":"FAQPage"' in content or '"@type": "FAQPage"' in content
            print(f"Schema FAQPage?: {'Yes' if hasFAQPage else 'No'}")
            print(f"Barrios section?: {'Yes' if 'barrios' in content.lower() else 'No'}")
            print("\n=== DRAFT PREVIEW (First 1500 chars) ===")
            print(content[:1500])
        else:
            print("Data not found")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    verify_output()
