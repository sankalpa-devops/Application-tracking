# import tkinter as tk
# from tkinter import messagebox
# import os
# import sys

# from sqlalchemy import create_engine, text
# from app.models.models import Base   # ✅ your structure


# # =========================
# # CONNECTION STRING BUILDER
# # =========================


# sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# def get_connection_string(db_type, username, password, host, port, database=None):
#     if db_type == "MySQL":
#         base = f"mysql+pymysql://{username}:{password}@{host}:{port}"
#         return f"{base}/{database}" if database else base

#     elif db_type == "PostgreSQL":
#         base = f"postgresql+psycopg2://{username}:{password}@{host}:{port}"
#         return f"{base}/{database}" if database else base

#     elif db_type == "MSSQL":
#         base = f"mssql+pyodbc://{username}:{password}@{host}:{port}"
#         return f"{base}/{database}?driver=ODBC+Driver+17+for+SQL+Server" if database else base


# # =========================
# # CREATE DATABASE
# # =========================
# def create_database_if_not_exists(db_type, engine, db_name):
#     with engine.connect() as conn:

#         if db_type == "MySQL":
#             conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))

#         elif db_type == "PostgreSQL":
#             conn.execution_options(isolation_level="AUTOCOMMIT")
#             result = conn.execute(
#                 text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'")
#             ).fetchone()

#             if not result:
#                 conn.execute(text(f"CREATE DATABASE {db_name}"))

#         elif db_type == "MSSQL":
#             conn.execute(text(f"""
#                 IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '{db_name}')
#                 CREATE DATABASE {db_name}
#             """))


# # =========================
# # CREATE .env FILE
# # =========================
# def save_env_config(db_type, user, password, host, port, db_name):
#     env_content = f"""
# DB_TYPE={db_type.lower()}
# DB_USER={user}
# DB_PASS={password}
# DB_HOST={host}
# DB_PORT={port}
# DB_NAME={db_name}
# """

#     # Warn if exists
#     if os.path.exists(".env"):
#         overwrite = messagebox.askyesno("Warning", ".env already exists. Overwrite?")
#         if not overwrite:
#             return

#     with open(".env", "w") as f:
#         f.write(env_content.strip())


# # =========================
# # INSTALL LOGIC
# # =========================
# def install_database():
#     db_type = db_var.get()
#     user = username.get()
#     pwd = password.get()
#     host_val = host.get() or "localhost"
#     port_val = port.get()
#     db_name = database.get()

#     if not all([user, pwd, port_val, db_name]):
#         messagebox.showerror("Error", "All fields are required!")
#         return

#     try:
#         # Step 1: connect without DB
#         engine = create_engine(
#             get_connection_string(db_type, user, pwd, host_val, port_val)
#         )

#         # Step 2: create DB
#         create_database_if_not_exists(db_type, engine, db_name)

#         # Step 3: connect to DB
#         final_conn = get_connection_string(
#             db_type, user, pwd, host_val, port_val, db_name
#         )
#         engine = create_engine(final_conn)

#         # Step 4: create tables
#         Base.metadata.create_all(engine)

#         # Step 5: create .env
#         save_env_config(db_type, user, pwd, host_val, port_val, db_name)

#         messagebox.showinfo("Success", "✅ ATS Database Installed Successfully!")

#     except Exception as e:
#         messagebox.showerror("Error", str(e))


# # =========================
# # UI DESIGN
# # =========================
# root = tk.Tk()
# root.title("ATS Backend Installer")
# root.geometry("400x480")


# tk.Label(root, text="ATS Database Installer",
#          font=("Arial", 14, "bold")).pack(pady=10)

# tk.Label(root, text="Select Database").pack()

# db_var = tk.StringVar(value="MySQL")
# tk.OptionMenu(root, db_var, "MySQL", "PostgreSQL", "MSSQL").pack(pady=5)


# def create_field(label, show=None):
#     tk.Label(root, text=label).pack()
#     entry = tk.Entry(root, show=show)
#     entry.pack(pady=5)
#     return entry


# username = create_field("Username")
# password = create_field("Password", "*")
# host = create_field("Host (default: localhost)")
# port = create_field("Port")
# database = create_field("Database Name")


# tk.Button(
#     root,
#     text="Install Database",
#     bg="green",
#     fg="white",
#     font=("Arial", 10, "bold"),
#     command=install_database
# ).pack(pady=20)


# root.mainloop()

import tkinter as tk
from tkinter import messagebox
import os
import secrets
import sys

from cryptography.fernet import Fernet
from sqlalchemy import create_engine, text
from app.models.models import Base

if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, BASE_DIR)

# =========================
# CONNECTION STRING BUILDER
# =========================
def get_connection_string(db_type, username, password,
                          host, port, database=None):

    if db_type == "MySQL":
        base = f"mysql+pymysql://{username}:{password}@{host}:{port}"
        return f"{base}/{database}" if database else base

    elif db_type == "PostgreSQL":
        base = f"postgresql+psycopg2://{username}:{password}@{host}:{port}"
        return f"{base}/{database}" if database else base

    elif db_type == "MSSQL":
        base = (
            f"mssql+pyodbc://{username}:{password}"
            f"@{host}:{port}"
        )

        if database:
            return (
                f"{base}/{database}"
                "?driver=ODBC+Driver+17+for+SQL+Server"
            )

        return (
            f"{base}/master"
            "?driver=ODBC+Driver+17+for+SQL+Server"
        )


# =========================
# CREATE DATABASE
# =========================
def create_database_if_not_exists(db_type, engine, db_name):

    with engine.connect() as conn:

        if db_type == "MySQL":

            conn.execute(
                text(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            )

        elif db_type == "PostgreSQL":

            conn = conn.execution_options(
                isolation_level="AUTOCOMMIT"
            )

            result = conn.execute(
                text(
                    f"SELECT 1 FROM pg_database "
                    f"WHERE datname='{db_name}'"
                )
            ).fetchone()

            if not result:
                conn.execute(
                    text(f"CREATE DATABASE {db_name}")
                )

        elif db_type == "MSSQL":

            conn.execute(text(f"""
                IF NOT EXISTS (
                    SELECT name
                    FROM sys.databases
                    WHERE name = '{db_name}'
                )
                CREATE DATABASE {db_name}
            """))

            conn.commit()


# =========================
# SAVE .ENV FILE
# =========================
def save_env_config(
        db_type,
        user,
        password,
        host,
        port,
        db_name,
        secret_key,
        fernet_key,
        email_user,
        email_pass,
        hr_email,
        frontend_url
):

    env_content = f"""
DB_TYPE={db_type.lower()}
DB_HOST={host}
DB_PORT={port}
DB_USER={user}
DB_PASS={password}
DB_NAME={db_name}

SECRET_KEY={secret_key}

FERNET_KEY={fernet_key}

EMAIL_USER={email_user}
EMAIL_PASS={email_pass}
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

HR_EMAIL={hr_email}

FRONTEND_URL={frontend_url}
"""

    if os.path.exists(".env"):

        overwrite = messagebox.askyesno(
            "Warning",
            ".env file already exists.\nOverwrite?"
        )

        if not overwrite:
            return

    with open(".env", "w") as f:
        f.write(env_content.strip())


# =========================
# INSTALL DATABASE
# =========================
def install_database():

    db_type = db_var.get()

    user = username.get().strip()
    pwd = password.get().strip()
    host_val = host.get().strip() or "localhost"
    port_val = port.get().strip()
    db_name = database.get().strip()

    email_user_val = email_user.get().strip()
    email_pass_val = email_pass.get().strip()

    hr_email_val = hr_email.get().strip()
    frontend_url_val = frontend_url.get().strip()

    if not all([
        user,
        pwd,
        port_val,
        db_name
    ]):
        messagebox.showerror(
            "Error",
            "Database fields are required."
        )
        return

    try:

        # AUTO GENERATE KEYS
        secret_key = secrets.token_hex(32)
        fernet_key = Fernet.generate_key().decode()

        # STEP 1
        temp_engine = create_engine(
            get_connection_string(
                db_type,
                user,
                pwd,
                host_val,
                port_val
            )
        )

        # STEP 2
        create_database_if_not_exists(
            db_type,
            temp_engine,
            db_name
        )

        # STEP 3
        final_conn = get_connection_string(
            db_type,
            user,
            pwd,
            host_val,
            port_val,
            db_name
        )

        engine = create_engine(final_conn)

        # STEP 4
        Base.metadata.create_all(engine)

        # STEP 5
        save_env_config(
            db_type,
            user,
            pwd,
            host_val,
            port_val,
            db_name,
            secret_key,
            fernet_key,
            email_user_val,
            email_pass_val,
            hr_email_val,
            frontend_url_val
        )

        messagebox.showinfo(
            "Success",
            "ATS Database Installed Successfully."
        )

    except Exception as e:
        messagebox.showerror(
            "Installation Error",
            str(e)
        )


# =========================
# TKINTER UI
# =========================
root = tk.Tk()

root.title("ATS Backend Installer")
root.geometry("450x750")
root.resizable(False, False)


# =========================
# TITLE
# =========================
title = tk.Label(
    root,
    text="ATS Backend Installer",
    font=("Arial", 16, "bold")
)

title.pack(pady=10)


# =========================
# DATABASE SELECT
# =========================
tk.Label(
    root,
    text="Select Database"
).pack()

db_var = tk.StringVar(value="MySQL")

db_menu = tk.OptionMenu(
    root,
    db_var,
    "MySQL",
    "PostgreSQL",
    "MSSQL"
)

db_menu.pack(pady=5)


# =========================
# FIELD CREATOR
# =========================
def create_field(label, show=None):

    tk.Label(root, text=label).pack()

    entry = tk.Entry(
        root,
        width=40,
        show=show
    )

    entry.pack(pady=5)

    return entry


# =========================
# DATABASE FIELDS
# =========================
username = create_field("DB Username")

password = create_field(
    "DB Password",
    "*"
)

host = create_field(
    "DB Host (default: localhost)"
)

port = create_field("DB Port")

database = create_field("Database Name")


# =========================
# EMAIL SETTINGS
# =========================
tk.Label(
    root,
    text="Email Configuration",
    font=("Arial", 12, "bold")
).pack(pady=10)

email_user = create_field("Email User")

email_pass = create_field(
    "Email Password",
    "*"
)

hr_email = create_field("HR Email")

frontend_url = create_field("Frontend URL")


# =========================
# INSTALL BUTTON
# =========================
install_btn = tk.Button(
    root,
    text="Install Database",
    bg="green",
    fg="white",
    width=25,
    height=2,
    font=("Arial", 10, "bold"),
    command=install_database
)

install_btn.pack(pady=20)


# =========================
# START APP
# =========================
root.mainloop()