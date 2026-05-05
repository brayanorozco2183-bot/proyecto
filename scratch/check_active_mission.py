 import sqlite3
import datetime

def check():
    conn = sqlite3.connect('maestro.db')
    cursor = conn.cursor()
    
    # Get active mission
    cursor.execute("SELECT id, niche, status, created_at FROM missions WHERE status IN ('PROCESSING', 'PENDING') ORDER BY created_at DESC LIMIT 1")
    mission = cursor.fetchone()
    
    if not mission:
        print("No active mission found.")
        return

    mid, niche, mstatus, created_at = mission
    print(f"Mission: {niche} ({mid})")
    print(f"Status: {mstatus}")
    print(f"Started at (UTC): {created_at}")
    
    # Calculate elapsed
    start = datetime.datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
    now = datetime.datetime.utcnow()
    elapsed = now - start
    print(f"Elapsed Time: {elapsed}")
    
    # Get cities
    cursor.execute("SELECT city, status FROM city_data WHERE mission_id = ?", (mid,))
    cities = cursor.fetchall()
    print(f"\nCities ({len(cities)}):")
    
    total_remaining = 0
    weights = {
        'PENDING': 300,
        'RESEARCHING': 240,
        'ANALYZED': 180,
        'WRITING': 120,
        'AUDITING': 60,
        'PIPELINE_RUNNING': 60,
        'PUBLISHED': 0,
        'STATIC_READY': 0,
        'COMPLETED': 0,
        'FAILED': 0
    }
    
    for city, status in cities:
        rem = weights.get(status.upper(), 200)
        total_remaining += rem
        print(f" - {city}: {status} (est. {rem}s remaining)")
        
    print(f"\nTotal Estimated Remaining: {total_remaining}s ({total_remaining/60:.1f}m)")
    
    conn.close()

if __name__ == "__main__":
    check()
