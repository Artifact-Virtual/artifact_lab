# Placeholder: PostgreSQL setup with pgvector must be active
import psycopg2

def connect_pg():
    return psycopg2.connect(dbname="pgdb", user="pguser", password="pgpass")

def insert_vector(id, vec):
    conn = connect_pg()
    cur = conn.cursor()
    cur.execute("INSERT INTO vectors (id, embedding) VALUES (%s, %s)", (id, vec.tolist()))
    conn.commit()
    conn.close()