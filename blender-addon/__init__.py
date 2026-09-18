bl_info = {
    "name": "MeshHub",
    "author": "MeshHub Team",
    "version": (1, 2, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > MeshHub",
    "description": "Git-like version control for Blender projects",
    "category": "3D View",
}


import bpy
import json
import urllib.request
import urllib.error
import uuid
import os
import re


# ============================================================
# CONFIGURATION
# ============================================================

API_URL = "http://localhost:3000/api"


# ============================================================
# RUNTIME STATE
# ============================================================

ACCESS_TOKEN = None

CURRENT_USER = None

PROJECTS = []

VERSIONS = []


# ============================================================
# HELPERS
# ============================================================

def sanitize_filename(filename):

    filename = re.sub(
        r'[<>:"/\\|?*]',
        '_',
        filename
    )

    filename = filename.strip()

    if not filename:
        filename = "meshhub_project"

    return filename


def get_selected_project():

    try:

        project_id = (
            bpy.context.scene.meshhub_project
        )

    except Exception:

        return None

    for project in PROJECTS:

        if project.get("id") == project_id:

            return project

    return None


def get_selected_version():

    try:

        version_number = (
            bpy.context.scene.meshhub_version
        )

    except Exception:

        return None

    if not version_number:

        return None

    try:

        return int(version_number)

    except ValueError:

        return None


# ============================================================
# LOGIN
# ============================================================

def login_to_meshhub(email, password):

    global ACCESS_TOKEN
    global CURRENT_USER

    endpoint = f"{API_URL}/auth/login"

    payload = {

        "email": email,

        "password": password,

    }

    data = json.dumps(
        payload
    ).encode("utf-8")

    request = urllib.request.Request(

        endpoint,

        data=data,

        method="POST",

    )

    request.add_header(

        "Content-Type",

        "application/json"

    )

    try:

        with urllib.request.urlopen(

            request,

            timeout=30

        ) as response:

            response_data = (
                response
                .read()
                .decode("utf-8")
            )

            result = json.loads(
                response_data
            )

            ACCESS_TOKEN = (
                result.get(
                    "access_token"
                )
            )

            CURRENT_USER = (
                result.get(
                    "user"
                )
            )

            if not ACCESS_TOKEN:

                return False, (
                    "No access token received"
                )

            return True, "Login successful"

    except urllib.error.HTTPError as error:

        try:

            body = (
                error
                .read()
                .decode("utf-8")
            )

            result = json.loads(body)

            message = result.get(
                "message",
                "Login failed"
            )

            if isinstance(message, list):

                message = ", ".join(message)

        except Exception:

            message = "Login failed"

        return False, message

    except urllib.error.URLError as error:

        return False, (
            f"Could not connect to MeshHub: "
            f"{error.reason}"
        )

    except Exception as error:

        return False, str(error)


def logout_from_meshhub():

    global ACCESS_TOKEN
    global CURRENT_USER
    global PROJECTS
    global VERSIONS

    ACCESS_TOKEN = None

    CURRENT_USER = None

    PROJECTS.clear()

    VERSIONS.clear()


# ============================================================
# FETCH PROJECTS
# ============================================================

def fetch_projects():

    global PROJECTS

    if not ACCESS_TOKEN:

        return False, "You are not logged in"

    endpoint = f"{API_URL}/projects"

    request = urllib.request.Request(

        endpoint,

        method="GET"

    )

    request.add_header(

        "Authorization",

        f"Bearer {ACCESS_TOKEN}"

    )

    try:

        with urllib.request.urlopen(

            request,

            timeout=30

        ) as response:

            data = (
                response
                .read()
                .decode("utf-8")
            )

            result = json.loads(data)

            PROJECTS = result.get(
                "data",
                []
            )

            return True, (
                f"{len(PROJECTS)} project(s) loaded"
            )

    except urllib.error.HTTPError as error:

        if error.code == 401:

            logout_from_meshhub()

            return False, (
                "Session expired. "
                "Please login again."
            )

        try:

            body = (
                error
                .read()
                .decode("utf-8")
            )

            result = json.loads(body)

            message = result.get(
                "message",
                "Failed to fetch projects"
            )

        except Exception:

            message = "Failed to fetch projects"

        return False, message

    except urllib.error.URLError as error:

        return False, (
            f"Could not connect to MeshHub: "
            f"{error.reason}"
        )

    except Exception as error:

        return False, str(error)


# ============================================================
# FETCH VERSION HISTORY
# ============================================================

def fetch_versions(project_id):

    global VERSIONS

    if not ACCESS_TOKEN:

        return False, "You are not logged in"

    endpoint = (
        f"{API_URL}/projects/"
        f"{project_id}/versions"
    )

    request = urllib.request.Request(

        endpoint,

        method="GET"

    )

    request.add_header(

        "Authorization",

        f"Bearer {ACCESS_TOKEN}"

    )

    try:

        with urllib.request.urlopen(

            request,

            timeout=30

        ) as response:

            data = (
                response
                .read()
                .decode("utf-8")
            )

            result = json.loads(data)

            VERSIONS = result.get(
                "versions",
                []
            )

            return True, (
                f"{len(VERSIONS)} version(s) loaded"
            )

    except urllib.error.HTTPError as error:

        if error.code == 401:

            logout_from_meshhub()

            return False, (
                "Session expired. "
                "Please login again."
            )

        try:

            body = (
                error
                .read()
                .decode("utf-8")
            )

            result = json.loads(body)

            message = result.get(
                "message",
                "Failed to fetch versions"
            )

        except Exception:

            message = "Failed to fetch versions"

        return False, message

    except urllib.error.URLError as error:

        return False, (
            f"Could not connect to MeshHub: "
            f"{error.reason}"
        )

    except Exception as error:

        return False, str(error)


# ============================================================
# PROJECT DROPDOWN
# ============================================================

def project_items(self, context):

    if not PROJECTS:

        return [

            (
                "",
                "No projects available",
                "Create a project on MeshHub first"
            )

        ]

    items = []

    for project in PROJECTS:

        project_id = project.get(
            "id"
        )

        title = project.get(
            "title",
            "Untitled Project"
        )

        description = project.get(
            "description",
            "MeshHub project"
        )

        items.append(

            (
                project_id,

                title,

                description or "MeshHub project"

            )

        )

    return items


# ============================================================
# VERSION DROPDOWN
# ============================================================

def version_items(self, context):

    if not VERSIONS:

        return [

            (
                "",
                "No versions available",
                "Push a Blender file first"
            )

        ]

    items = []

    for version in VERSIONS:

        number = version.get(
            "versionNumber"
        )

        message = version.get(
            "commitMessage"
        ) or "No commit message"

        identifier = str(number)

        label = f"v{number} — {message}"

        description = (
            f"Version {number}"
        )

        items.append(

            (
                identifier,

                label,

                description

            )

        )

    return items


# ============================================================
# LOGIN OPERATOR
# ============================================================

class MESHHUB_OT_login(
    bpy.types.Operator
):

    bl_idname = "meshhub.login"

    bl_label = "Login to MeshHub"

    bl_description = (
        "Login to your MeshHub account"
    )


    email: bpy.props.StringProperty(

        name="Email"

    )


    password: bpy.props.StringProperty(

        name="Password",

        subtype="PASSWORD"

    )


    def invoke(
        self,
        context,
        event
    ):

        return (
            context
            .window_manager
            .invoke_props_dialog(self)
        )


    def draw(
        self,
        context
    ):

        layout = self.layout

        layout.prop(
            self,
            "email"
        )

        layout.prop(
            self,
            "password"
        )


    def execute(
        self,
        context
    ):

        success, message = (
            login_to_meshhub(
                self.email,
                self.password
            )
        )

        if not success:

            self.report(
                {'ERROR'},
                message
            )

            return {'CANCELLED'}

        projects_loaded, project_message = (
            fetch_projects()
        )

        if not projects_loaded:

            self.report(
                {'WARNING'},
                project_message
            )

            return {'FINISHED'}

        self.report(
            {'INFO'},
            (
                f"Logged in. "
                f"{project_message}"
            )
        )

        return {'FINISHED'}


# ============================================================
# LOGOUT
# ============================================================

class MESHHUB_OT_logout(
    bpy.types.Operator
):

    bl_idname = "meshhub.logout"

    bl_label = "Logout"


    def execute(
        self,
        context
    ):

        logout_from_meshhub()

        context.scene.meshhub_project = ""

        context.scene.meshhub_version = ""

        self.report(
            {'INFO'},
            "Logged out from MeshHub"
        )

        return {'FINISHED'}


# ============================================================
# REFRESH PROJECTS
# ============================================================

class MESHHUB_OT_refresh_projects(
    bpy.types.Operator
):

    bl_idname = "meshhub.refresh_projects"

    bl_label = "Refresh Projects"


    def execute(
        self,
        context
    ):

        if not ACCESS_TOKEN:

            self.report(
                {'ERROR'},
                "Please login first"
            )

            return {'CANCELLED'}

        success, message = (
            fetch_projects()
        )

        if not success:

            self.report(
                {'ERROR'},
                message
            )

            return {'CANCELLED'}

        context.scene.meshhub_version = ""

        VERSIONS.clear()

        self.report(
            {'INFO'},
            message
        )

        return {'FINISHED'}


# ============================================================
# REFRESH VERSIONS
# ============================================================

class MESHHUB_OT_refresh_versions(
    bpy.types.Operator
):

    bl_idname = "meshhub.refresh_versions"

    bl_label = "Refresh Versions"


    def execute(
        self,
        context
    ):

        if not ACCESS_TOKEN:

            self.report(
                {'ERROR'},
                "Please login first"
            )

            return {'CANCELLED'}

        project_id = (
            context.scene.meshhub_project
        )

        if not project_id:

            self.report(
                {'ERROR'},
                "Please select a project"
            )

            return {'CANCELLED'}

        success, message = (
            fetch_versions(
                project_id
            )
        )

        if not success:

            self.report(
                {'ERROR'},
                message
            )

            return {'CANCELLED'}

        context.scene.meshhub_version = ""

        self.report(
            {'INFO'},
            message
        )

        return {'FINISHED'}


# ============================================================
# PROJECT CHANGE
# ============================================================

def project_changed(
    self,
    context
):

    VERSIONS.clear()

    context.scene.meshhub_version = ""

    project_id = (
        context.scene.meshhub_project
    )

    if not project_id:

        return

    if not ACCESS_TOKEN:

        return

    success, message = (
        fetch_versions(
            project_id
        )
    )

    if not success:

        print(
            f"MeshHub: {message}"
        )


# ============================================================
# PUSH
# ============================================================

class MESHHUB_OT_push(
    bpy.types.Operator
):

    bl_idname = "meshhub.push"

    bl_label = "Push to MeshHub"

    bl_description = (
        "Push the current Blender file "
        "to MeshHub"
    )


    commit_message: bpy.props.StringProperty(

        name="Commit Message",

        description=(
            "Describe what changed"
        ),

        default="Updated Blender project"

    )


    def invoke(
        self,
        context,
        event
    ):

        return (
            context
            .window_manager
            .invoke_props_dialog(self)
        )


    def draw(
        self,
        context
    ):

        layout = self.layout

        layout.prop(
            self,
            "commit_message"
        )


    def execute(
        self,
        context
    ):

        if not ACCESS_TOKEN:

            self.report(
                {'ERROR'},
                "Please login first"
            )

            return {'CANCELLED'}


        project_id = (
            context.scene.meshhub_project
        )


        if not project_id:

            self.report(
                {'ERROR'},
                "Please select a project"
            )

            return {'CANCELLED'}


        current_file = (
            bpy.data.filepath
        )


        if not current_file:

            self.report(
                {'ERROR'},
                "Please save your Blender file first"
            )

            return {'CANCELLED'}


        if not os.path.exists(
            current_file
        ):

            self.report(
                {'ERROR'},
                "Blender file does not exist"
            )

            return {'CANCELLED'}


        # ----------------------------------------------------
        # Save Blender file
        # ----------------------------------------------------

        try:

            bpy.ops.wm.save_as_mainfile(
                filepath=current_file
            )

        except Exception as error:

            self.report(
                {'ERROR'},
                (
                    f"Failed to save Blender file: "
                    f"{error}"
                )
            )

            return {'CANCELLED'}


        # ----------------------------------------------------
        # Read file
        # ----------------------------------------------------

        try:

            with open(
                current_file,
                "rb"
            ) as file:

                file_data = file.read()

        except Exception as error:

            self.report(
                {'ERROR'},
                (
                    f"Failed to read Blender file: "
                    f"{error}"
                )
            )

            return {'CANCELLED'}


        # ----------------------------------------------------
        # Multipart request
        # ----------------------------------------------------

        boundary = uuid.uuid4().hex

        filename = os.path.basename(
            current_file
        )


        body = []


        # File field

        body.append(

            (
                f"--{boundary}\r\n"

                f'Content-Disposition: form-data; '
                f'name="file"; '
                f'filename="{filename}"\r\n'

                f"Content-Type: "
                f"application/x-blender\r\n"

                f"\r\n"

            ).encode("utf-8")

        )


        body.append(
            file_data
        )


        # Commit message field

        body.append(

            (

                f"\r\n"
                f"--{boundary}\r\n"

                f'Content-Disposition: form-data; '
                f'name="commitMessage"\r\n'

                f"\r\n"

                f"{self.commit_message}"

            ).encode("utf-8")

        )


        body.append(

            (

                f"\r\n"
                f"--{boundary}--\r\n"

            ).encode("utf-8")

        )


        request_body = b"".join(
            body
        )


        # ----------------------------------------------------
        # Request
        # ----------------------------------------------------

        endpoint = (

            f"{API_URL}/projects/"
            f"{project_id}/push"

        )


        request = urllib.request.Request(

            endpoint,

            data=request_body,

            method="POST"

        )


        request.add_header(

            "Content-Type",

            (
                "multipart/form-data; "
                f"boundary={boundary}"
            )

        )


        request.add_header(

            "Authorization",

            f"Bearer {ACCESS_TOKEN}"

        )


        # ----------------------------------------------------
        # Send
        # ----------------------------------------------------

        try:

            with urllib.request.urlopen(

                request,

                timeout=120

            ) as response:

                response_data = (
                    response
                    .read()
                    .decode("utf-8")
                )


            result = json.loads(
                response_data
            )


            version = result.get(
                "version",
                {}
            )


            version_number = version.get(
                "versionNumber",
                "?"
            )


            # Refresh versions

            fetch_versions(
                project_id
            )


            self.report(
                {'INFO'},
                (
                    f"Push successful! "
                    f"Version {version_number}"
                )
            )


            return {'FINISHED'}


        except urllib.error.HTTPError as error:

            if error.code == 401:

                logout_from_meshhub()

                self.report(
                    {'ERROR'},
                    "Session expired"
                )

                return {'CANCELLED'}


            try:

                body = (
                    error
                    .read()
                    .decode("utf-8")
                )

                result = json.loads(
                    body
                )

                message = result.get(
                    "message",
                    "Push failed"
                )


                if isinstance(
                    message,
                    list
                ):

                    message = ", ".join(
                        message
                    )


            except Exception:

                message = "Push failed"


            self.report(
                {'ERROR'},
                f"MeshHub error: {message}"
            )

            return {'CANCELLED'}


        except urllib.error.URLError as error:

            self.report(
                {'ERROR'},
                (
                    f"Could not connect: "
                    f"{error.reason}"
                )
            )

            return {'CANCELLED'}


        except Exception as error:

            self.report(
                {'ERROR'},
                f"Push failed: {error}"
            )

            return {'CANCELLED'}


# ============================================================
# PULL LATEST
# ============================================================

class MESHHUB_OT_pull_latest(
    bpy.types.Operator
):

    bl_idname = "meshhub.pull_latest"

    bl_label = "Pull Latest"

    bl_description = (
        "Download the latest Blender file"
        " from MeshHub"
    )


    def execute(
        self,
        context
    ):

        if not ACCESS_TOKEN:

            self.report(
                {'ERROR'},
                "Please login first"
            )

            return {'CANCELLED'}


        project_id = (
            context.scene.meshhub_project
        )


        if not project_id:

            self.report(
                {'ERROR'},
                "Please select a project"
            )

            return {'CANCELLED'}


        project = get_selected_project()


        if not project:

            self.report(
                {'ERROR'},
                "Project not found"
            )

            return {'CANCELLED'}


        project_title = project.get(
            "title",
            "meshhub_project"
        )


        endpoint = (

            f"{API_URL}/projects/"
            f"{project_id}/download"

        )


        request = urllib.request.Request(

            endpoint,

            method="GET"

        )


        request.add_header(

            "Authorization",

            f"Bearer {ACCESS_TOKEN}"

        )


        try:

            with urllib.request.urlopen(

                request,

                timeout=120

            ) as response:

                file_data = response.read()


        except Exception as error:

            self.report(
                {'ERROR'},
                f"Pull failed: {error}"
            )

            return {'CANCELLED'}


        if not file_data:

            self.report(
                {'ERROR'},
                "Downloaded file is empty"
            )

            return {'CANCELLED'}


        if not file_data.startswith(
            b"BLENDER"
        ):

            self.report(
                {'ERROR'},
                "Downloaded file is not a Blender file"
            )

            return {'CANCELLED'}


        # ----------------------------------------------------
        # Determine directory
        # ----------------------------------------------------

        current_file = bpy.data.filepath


        if current_file:

            directory = os.path.dirname(
                current_file
            )

        else:

            directory = os.path.expanduser(
                "~/Downloads"
            )


        os.makedirs(
            directory,
            exist_ok=True
        )


        # ----------------------------------------------------
        # Filename
        # ----------------------------------------------------

        safe_title = sanitize_filename(
            project_title
        )


        base_name = (
            f"{safe_title}_meshhub_latest"
        )


        output_path = os.path.join(

            directory,

            f"{base_name}.blend"

        )


        counter = 1


        while os.path.exists(
            output_path
        ):

            output_path = os.path.join(

                directory,

                f"{base_name}_{counter}.blend"

            )

            counter += 1


        # ----------------------------------------------------
        # Save
        # ----------------------------------------------------

        try:

            with open(
                output_path,
                "wb"
            ) as file:

                file.write(
                    file_data
                )

        except Exception as error:

            self.report(
                {'ERROR'},
                f"Could not save file: {error}"
            )

            return {'CANCELLED'}


        # ----------------------------------------------------
        # Open
        # ----------------------------------------------------

        try:

            bpy.ops.wm.open_mainfile(

                filepath=output_path

            )

        except Exception as error:

            self.report(
                {'ERROR'},
                (
                    f"Downloaded successfully "
                    f"but could not open: {error}"
                )
            )

            return {'CANCELLED'}


        return {'FINISHED'}


# ============================================================
# DOWNLOAD VERSION
# ============================================================

class MESHHUB_OT_download_version(
    bpy.types.Operator
):

    bl_idname = "meshhub.download_version"

    bl_label = "Download Version"

    bl_description = (
        "Download the selected version"
    )


    def execute(
        self,
        context
    ):

        if not ACCESS_TOKEN:

            self.report(
                {'ERROR'},
                "Please login first"
            )

            return {'CANCELLED'}


        project_id = (
            context.scene.meshhub_project
        )


        version_number = (
            get_selected_version()
        )


        if not project_id:

            self.report(
                {'ERROR'},
                "Please select a project"
            )

            return {'CANCELLED'}


        if not version_number:

            self.report(
                {'ERROR'},
                "Please select a version"
            )

            return {'CANCELLED'}


        project = get_selected_project()


        if not project:

            self.report(
                {'ERROR'},
                "Project not found"
            )

            return {'CANCELLED'}


        project_title = project.get(
            "title",
            "meshhub_project"
        )


        endpoint = (

            f"{API_URL}/projects/"
            f"{project_id}/versions/"
            f"{version_number}/download"

        )


        request = urllib.request.Request(

            endpoint,

            method="GET"

        )


        request.add_header(

            "Authorization",

            f"Bearer {ACCESS_TOKEN}"

        )


        try:

            with urllib.request.urlopen(

                request,

                timeout=120

            ) as response:

                file_data = response.read()


        except urllib.error.HTTPError as error:

            self.report(
                {'ERROR'},
                f"Download failed: {error}"
            )

            return {'CANCELLED'}


        except Exception as error:

            self.report(
                {'ERROR'},
                f"Download failed: {error}"
            )

            return {'CANCELLED'}


        if not file_data.startswith(
            b"BLENDER"
        ):

            self.report(
                {'ERROR'},
                "Downloaded file is not a Blender file"
            )

            return {'CANCELLED'}


        # ----------------------------------------------------
        # Directory
        # ----------------------------------------------------

        current_file = bpy.data.filepath


        if current_file:

            directory = os.path.dirname(
                current_file
            )

        else:

            directory = os.path.expanduser(
                "~/Downloads"
            )


        os.makedirs(
            directory,
            exist_ok=True
        )


        # ----------------------------------------------------
        # Filename
        # ----------------------------------------------------

        safe_title = sanitize_filename(
            project_title
        )


        base_name = (
            f"{safe_title}_v{version_number}"
        )


        output_path = os.path.join(

            directory,

            f"{base_name}.blend"

        )


        counter = 1


        while os.path.exists(
            output_path
        ):

            output_path = os.path.join(

                directory,

                f"{base_name}_{counter}.blend"

            )

            counter += 1


        # ----------------------------------------------------
        # Save
        # ----------------------------------------------------

        try:

            with open(

                output_path,

                "wb"

            ) as file:

                file.write(
                    file_data
                )

        except Exception as error:

            self.report(
                {'ERROR'},
                f"Could not save version: {error}"
            )

            return {'CANCELLED'}


        self.report(

            {'INFO'},

            (
                f"Version {version_number} "
                f"downloaded"
            )

        )


        return {'FINISHED'}


# ============================================================
# RESTORE VERSION
# ============================================================

class MESHHUB_OT_restore_version(
    bpy.types.Operator
):

    bl_idname = "meshhub.restore_version"

    bl_label = "Restore Version"

    bl_description = (
        "Restore the selected version "
        "as the latest MeshHub version"
    )


    def invoke(
        self,
        context,
        event
    ):

        version_number = (
            get_selected_version()
        )

        if not version_number:

            self.report(
                {'ERROR'},
                "Please select a version"
            )

            return {'CANCELLED'}


        return (
            context
            .window_manager
            .invoke_confirm(
                self,
                event
            )
        )


    def execute(
        self,
        context
    ):

        if not ACCESS_TOKEN:

            self.report(
                {'ERROR'},
                "Please login first"
            )

            return {'CANCELLED'}


        project_id = (
            context.scene.meshhub_project
        )


        version_number = (
            get_selected_version()
        )


        if not project_id:

            self.report(
                {'ERROR'},
                "Please select a project"
            )

            return {'CANCELLED'}


        if not version_number:

            self.report(
                {'ERROR'},
                "Please select a version"
            )

            return {'CANCELLED'}


        endpoint = (

            f"{API_URL}/projects/"
            f"{project_id}/versions/"
            f"{version_number}/restore"

        )


        request = urllib.request.Request(

            endpoint,

            method="POST"

        )


        request.add_header(

            "Authorization",

            f"Bearer {ACCESS_TOKEN}"

        )


        request.add_header(

            "Content-Type",

            "application/json"

        )


        try:

            with urllib.request.urlopen(

                request,

                timeout=60

            ) as response:

                data = (
                    response
                    .read()
                    .decode("utf-8")
                )


            result = json.loads(
                data
            )


            new_version = result.get(
                "newVersion",
                {}
            )


            new_version_number = (
                new_version.get(
                    "versionNumber",
                    "?"
                )
            )


            # Refresh history

            fetch_versions(
                project_id
            )


            self.report(

                {'INFO'},

                (
                    f"Version {version_number} "
                    f"restored as v"
                    f"{new_version_number}"
                )

            )


            return {'FINISHED'}


        except urllib.error.HTTPError as error:

            try:

                body = (
                    error
                    .read()
                    .decode("utf-8")
                )

                result = json.loads(body)

                message = result.get(
                    "message",
                    "Restore failed"
                )

            except Exception:

                message = "Restore failed"


            self.report(
                {'ERROR'},
                f"MeshHub error: {message}"
            )

            return {'CANCELLED'}


        except Exception as error:

            self.report(
                {'ERROR'},
                f"Restore failed: {error}"
            )

            return {'CANCELLED'}


# ============================================================
# UI PANEL
# ============================================================

class MESHHUB_PT_panel(
    bpy.types.Panel
):

    bl_label = "MeshHub"

    bl_idname = "MESHHUB_PT_panel"

    bl_space_type = "VIEW_3D"

    bl_region_type = "UI"

    bl_category = "MeshHub"


    def draw(
        self,
        context
    ):

        layout = self.layout


        # ====================================================
        # NOT LOGGED IN
        # ====================================================

        if not ACCESS_TOKEN:

            layout.label(

                text="Not connected",

                icon="UNLINKED"

            )


            layout.separator()


            layout.operator(

                "meshhub.login",

                icon="KEYINGSET"

            )


            layout.separator()


            layout.label(

                text="Login to access MeshHub."

            )


            return


        # ====================================================
        # USER
        # ====================================================

        layout.label(

            text="Connected",

            icon="LINKED"

        )


        if CURRENT_USER:

            username = CURRENT_USER.get(

                "username",

                "User"

            )


            layout.label(

                text=f"User: {username}",

                icon="USER"

            )


        # ====================================================
        # LOGOUT
        # ====================================================

        layout.separator()


        layout.operator(

            "meshhub.logout",

            icon="QUIT"

        )


        # ====================================================
        # PROJECT
        # ====================================================

        layout.separator()


        row = layout.row()


        row.label(

            text="Project",

            icon="FILE_FOLDER"

        )


        row.operator(

            "meshhub.refresh_projects",

            text="",

            icon="FILE_REFRESH"

        )


        if PROJECTS:

            layout.prop(

                context.scene,

                "meshhub_project",

                text=""

            )

        else:

            layout.label(

                text="No projects available",

                icon="INFO"

            )


        # ====================================================
        # CURRENT FILE
        # ====================================================

        layout.separator()


        layout.label(

            text="Current File",

            icon="FILE_BLEND"

        )


        current_file = bpy.data.filepath


        if current_file:

            filename = os.path.basename(

                current_file

            )


            layout.label(

                text=filename

            )

        else:

            layout.label(

                text="File not saved"

            )


        # ====================================================
        # PULL / PUSH
        # ====================================================

        layout.separator()


        selected_project = (

            context.scene.meshhub_project

        )


        pull_row = layout.row()


        pull_row.enabled = bool(

            selected_project

        )


        pull_row.operator(

            "meshhub.pull_latest",

            text="Pull Latest",

            icon="IMPORT"

        )


        push_row = layout.row()


        push_row.enabled = bool(

            selected_project

        )


        push_row.operator(

            "meshhub.push",

            text="Push to MeshHub",

            icon="EXPORT"

        )


        # ====================================================
        # VERSION HISTORY
        # ====================================================

        layout.separator()


        row = layout.row()


        row.label(

            text="Version History",

            icon="TIME"

        )


        row.operator(

            "meshhub.refresh_versions",

            text="",

            icon="FILE_REFRESH"

        )


        if VERSIONS:

            layout.prop(

                context.scene,

                "meshhub_version",

                text=""

            )


            selected_version = (
                get_selected_version()
            )


            # ------------------------------------------------
            # Download
            # ------------------------------------------------

            download_row = (
                layout.row()
            )


            download_row.enabled = bool(

                selected_version

            )


            download_row.operator(

                "meshhub.download_version",

                text="Download Version",

                icon="IMPORT"

            )


            # ------------------------------------------------
            # Restore
            # ------------------------------------------------

            restore_row = (
                layout.row()
            )


            restore_row.enabled = bool(

                selected_version

            )


            restore_row.operator(

                "meshhub.restore_version",

                text="Restore Version",

                icon="LOOP_BACK"

            )


        else:

            layout.label(

                text="No versions available",

                icon="INFO"

            )


# ============================================================
# CLASSES
# ============================================================

classes = (

    MESHHUB_OT_login,

    MESHHUB_OT_logout,

    MESHHUB_OT_refresh_projects,

    MESHHUB_OT_refresh_versions,

    MESHHUB_OT_push,

    MESHHUB_OT_pull_latest,

    MESHHUB_OT_download_version,

    MESHHUB_OT_restore_version,

    MESHHUB_PT_panel,

)


# ============================================================
# REGISTER
# ============================================================

def register():

    for cls in classes:

        bpy.utils.register_class(cls)


    bpy.types.Scene.meshhub_project = (

        bpy.props.EnumProperty(

            name="MeshHub Project",

            description=(
                "Select a MeshHub project"
            ),

            items=project_items,

            update=project_changed,

        )

    )


    bpy.types.Scene.meshhub_version = (

        bpy.props.EnumProperty(

            name="MeshHub Version",

            description=(
                "Select a project version"
            ),

            items=version_items,

        )

    )


# ============================================================
# UNREGISTER
# ============================================================

def unregister():

    del bpy.types.Scene.meshhub_version

    del bpy.types.Scene.meshhub_project


    for cls in reversed(classes):

        bpy.utils.unregister_class(cls)


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    register()