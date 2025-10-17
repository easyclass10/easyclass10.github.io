const navBarra=document.getElementById("navBarra")
navBarra.innerHTML=`
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top" aria-label="Menú de navegación principal">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.html" aria-label="Página de inicio de EasyClass">
                <img src="../nk.png" alt="Logo de EasyClass" width="40" height="40" class="me-2">
                <span class="brand-green">easy</span><span class="brand-red">class</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Alternar navegación">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="../cursos.html">Cursos</a></li>
                    <li class="nav-item"><a class="nav-link" href="../herramientas.html">Herramientas</a></li>
                    <li class="nav-item"><a class="nav-link" href="../servicios.html">Servicios</a></li>
                    <li class="nav-item ms-lg-3">
                        <a class="btn btn-success" href="https://wa.me/573044435307?text=Hola,%20quisiera%20más%20información%20sobre%20los%20servicios%20de%20EasyClass" target="_blank">Pedir Info</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
`