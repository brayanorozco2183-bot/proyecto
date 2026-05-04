import sqlite3

def get_logs():
    try:
        conn = sqlite3.connect('maestro.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM PRAGMA_TABLE_INFO('city_data');")
        columns = [row[0] for row in cursor.fetchall()]
        print(f"Columns in city_data: {columns}")
        
        cursor.execute("SELECT content_draft, status, nap_data FROM city_data WHERE city='Valencia' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        
        if row:
            print("\n=== STATUS ===")
            print(row[1])
            print("\n=== NAP DATA ===")
            print(row[2])
            print("\n=== DRAFT PREVIEW ===")
            print(str(row[0])[:2000])
        else:
            print("Data not found")
            
        cursor.execute("SELECT agent_logs FROM missions WHERE id = (SELECT mission_id FROM city_data WHERE city='Valencia' ORDER BY id DESC LIMIT 1)")
        m_row = cursor.fetchone()
        if m_row:
             print("\n=== MISSION LOGS ===")
             print(str(m_row[0]))            
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    get_logs()
