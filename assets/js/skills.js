/* Skills as a cloud map: "My Skills" in the centre, categories around it. Click a category to open it;
   Cloud opens into AWS, Azure and GCP, each with its services. Click the centre or the breadcrumb to go back. */
(function () {
  "use strict";
  var map = document.getElementById("skMap");
  if (!map) return;
  var lines = document.getElementById("skLines");
  var nodesEl = document.getElementById("skNodes");
  var crumbs = document.getElementById("skCrumbs");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  var ICON = {
    cloud: "M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.4 4.3 4.3 0 0 0 7 18z",
    iac: "M12 3 3 7.5l9 4.5 9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5",
    box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9",
    loop: "M4 12a8 8 0 0 1 14-5.3L20 9M20 3.5V9h-5.5M20 12a8 8 0 0 1-14 5.3L4 15M4 20.5V15h5.5",
    pulse: "M3 12h4l2.5-6 4.5 12 2.5-6H21",
    shield: "M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6zM9 12l2 2 4-4",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18",
    term: "M4 5h16v14H4zM7.5 9.5l3 2.5-3 2.5M12.5 15h4"
  };

  // official logos (Devicon, AWS Architecture Icons, Simple Icons); file names in assets/skills/
  var LOGO = {"K8s networking": "t-kubernetes", "aws:EC2": "aws-amazonec2", "aws:Auto Scaling": "aws-amazonec2autoscaling", "aws:ELB": "aws-elasticloadbalancing", "aws:EKS": "aws-amazonelastickubernetesservice", "aws:ECS": "aws-amazonelasticcontainerservice", "aws:ECR": "aws-amazonelasticcontainerregistry", "aws:Lambda": "aws-awslambda", "aws:S3": "aws-amazonsimplestorageservice", "aws:RDS": "aws-amazonrds", "aws:Aurora": "aws-amazonaurora", "aws:DMS": "aws-awsdatabasemigrationservice", "aws:VPC": "aws-amazonvirtualprivatecloud", "aws:Route 53": "aws-amazonroute53", "aws:CloudFront": "aws-amazoncloudfront", "aws:IAM": "aws-awsidentityandaccessmanagement", "aws:STS": "aws-awsidentityandaccessmanagement", "aws:KMS": "aws-awskeymanagementservice", "aws:Organizations": "aws-awsorganizations", "aws:CloudWatch": "aws-amazoncloudwatch", "aws:CloudTrail": "aws-awscloudtrail", "aws:CloudFormation": "aws-awscloudformation", "aws:SNS": "aws-amazonsimplenotificationservice", "aws:SQS": "aws-amazonsimplequeueservice", "aws:EventBridge": "aws-amazoneventbridge", "aws:Step Functions": "aws-awsstepfunctions", "aws:CodePipeline": "aws-awscodepipeline", "aws:CodeBuild": "aws-awscodebuild", "aws:CodeDeploy": "aws-awscodedeploy", "AWS": "t-aws", "Azure": "t-azure", "GCP": "t-gcp", "Terraform": "t-terraform", "Ansible": "t-ansible", "Docker": "t-docker", "Kubernetes": "t-kubernetes", "GitHub Actions": "t-github-actions", "GitLab CI/CD": "t-gitlab-ci-cd", "Jenkins": "t-jenkins", "CircleCI": "t-circleci", "Argo CD (GitOps)": "t-argo-cd-gitops", "Maven": "t-maven", "Gradle": "t-gradle", "SonarQube": "t-sonarqube", "Nexus": "t-nexus", "Datadog": "t-datadog", "New Relic": "t-new-relic", "Prometheus": "t-prometheus", "Grafana": "t-grafana", "Opsgenie": "t-opsgenie", "Okta": "t-okta", "OIDC": "t-oidc", "Bash": "t-bash", "Python (Boto3)": "t-python-boto3", "Linux": "t-linux", "Git": "t-git", "Bitbucket": "t-bitbucket", "Jira": "t-jira", "NGINX": "t-nginx", "Amazon EKS": "aws-amazonelastickubernetesservice", "Amazon ECS": "aws-amazonelasticcontainerservice", "Amazon ECR": "aws-amazonelasticcontainerregistry", "AWS CodePipeline": "aws-awscodepipeline", "CodeBuild": "aws-awscodebuild", "CodeDeploy": "aws-awscodedeploy", "IAM least privilege": "aws-awsidentityandaccessmanagement", "Service Control Policies": "aws-awsorganizations", "KMS encryption": "aws-awskeymanagementservice", "S3 security": "aws-amazonsimplestorageservice", "Network ACLs": "aws-amazonvirtualprivatecloud", "VPC design": "aws-amazonvirtualprivatecloud", "Public & private subnets": "aws-amazonvirtualprivatecloud", "Route tables": "aws-amazonvirtualprivatecloud", "Security groups": "aws-amazonvirtualprivatecloud", "NAT & Internet GW": "aws-amazonvirtualprivatecloud", "DNS · Route 53": "aws-amazonroute53", "Load balancing": "aws-elasticloadbalancing", "Remote state · S3 + locking": "aws-amazonsimplestorageservice", "CloudFormation": "aws-awscloudformation", "CloudWatch": "aws-amazoncloudwatch", "CloudTrail": "aws-awscloudtrail", "Log pipelines": "aws-amazoncloudwatch", "OIDC auth": "t-oidc", "Shell scripting": "t-bash", "GitLab": "t-gitlab-ci-cd", "Ingress controllers": "t-nginx", "Reverse proxies": "t-nginx", "Argo CD rollouts": "t-argo-cd-gitops", "Terraform modules": "t-terraform"};
  var FEATURE = { "Cloud": ["AWS", "Azure", "GCP"], "Infrastructure as Code": ["Terraform", "Ansible", "CloudFormation"],
    "Containers": ["Docker", "Kubernetes", "Amazon EKS"], "CI/CD": ["GitHub Actions", "GitLab CI/CD", "Jenkins"],
    "Observability": ["Datadog", "Prometheus", "Grafana"], "Security & governance": ["IAM least privilege", "KMS encryption", "Okta"],
    "Networking": ["VPC design", "DNS · Route 53", "Load balancing"], "Scripting & tools": ["Bash", "Python (Boto3)", "Linux"] };
  function logoFor(name, parent) {
    var key = parent && parent.tone === "aws" ? "aws:" + name : name;
    if (LOGO[key]) return LOGO[key];
    if (parent && (parent.tone === "azure" || parent.tone === "gcp")) return LOGO[parent.name];   // provider logo until per-service icons are added
    return null;
  }
  function img(file, cls) { return '<img class="' + cls + '" src="assets/skills/' + file + '.svg" alt="" loading="lazy" decoding="async">'; }
  function mark(node, cls) {
    if (LOGO[node.name] && node.tone) return img(LOGO[node.name], cls + " sk-brand");
    var f = FEATURE[node.name];
    if (f) return '<span class="sk-trio">' + f.map(function (n) { return LOGO[n] ? img(LOGO[n], "sk-mini") : ""; }).join("") + '</span>';
    return iconSvg(node.icon);
  }
  var TREE = { name: "My Skills", icon: "cloud", children: [
    { name: "Cloud", icon: "cloud", children: [
      { name: "AWS", icon: "cloud", tone: "aws", children: ["EC2", "Auto Scaling", "ELB", "EKS", "ECS", "ECR", "Lambda", "S3", "RDS", "Aurora", "DMS",
        "VPC", "Route 53", "CloudFront", "IAM", "STS", "KMS", "Organizations", "CloudWatch", "CloudTrail", "CloudFormation",
        "SNS", "SQS", "EventBridge", "Step Functions", "CodePipeline", "CodeBuild", "CodeDeploy"] },
      { name: "Azure", icon: "cloud", tone: "azure", children: ["Virtual Machines", "AKS", "Blob Storage", "Virtual Network", "Entra ID", "Key Vault", "Azure Monitor", "Azure DevOps"] },
      { name: "GCP", icon: "cloud", tone: "gcp", children: ["Compute Engine", "GKE", "Cloud Storage", "Cloud SQL", "VPC", "IAM", "Cloud Monitoring", "Cloud Build"] }
    ] },
    { name: "Infrastructure as Code", short: "IaC", icon: "iac", children: ["Terraform", "Terraform modules", "Remote state · S3 + locking", "Atlantis", "CloudFormation", "Ansible"] },
    { name: "Containers", icon: "box", children: ["Docker", "Kubernetes", "Amazon EKS", "Amazon ECS", "Amazon ECR", "Ingress controllers", "K8s networking", "Container security", "Argo CD rollouts"] },
    { name: "CI/CD", icon: "loop", children: ["GitHub Actions", "GitLab CI/CD", "Jenkins", "CircleCI", "Argo CD (GitOps)", "AWS CodePipeline", "CodeBuild", "CodeDeploy", "OIDC auth", "Maven", "Gradle", "SonarQube", "Nexus"] },
    { name: "Observability", icon: "pulse", children: ["Datadog", "CloudWatch", "CloudTrail", "New Relic", "Prometheus", "Grafana", "Opsgenie", "Alerting", "Log pipelines", "AIOps · anomaly detection", "DORA metrics"] },
    { name: "Security & governance", short: "Security", icon: "shield", children: ["IAM least privilege", "Service Control Policies", "KMS encryption", "S3 security", "Network ACLs", "OIDC", "Okta", "Cloud security posture", "Drata compliance"] },
    { name: "Networking", icon: "globe", children: ["VPC design", "Public & private subnets", "Route tables", "Security groups", "NAT & Internet GW", "DNS · Route 53", "TLS", "Load balancing", "Reverse proxies"] },
    { name: "Scripting & tools", short: "Scripting", icon: "term", children: ["Bash", "Shell scripting", "Python (Boto3)", "Linux", "Git", "GitLab", "Bitbucket", "Jira"] }
  ] };
  // parent links
  (function link(n, p) { n.parent = p; (n.children || []).forEach(function (c) { if (typeof c === "object") link(c, n); }); })(TREE, null);

  function iconSvg(name, cls) {
    return '<svg class="' + (cls || "sk-ic") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[name] + '"/></svg>';
  }
  var CLOUD = '<svg class="sk-cloud" viewBox="0 0 200 124" aria-hidden="true" preserveAspectRatio="none"><path d="M52 116a42 42 0 0 1-8-83 52 52 0 0 1 98-14 40 40 0 0 1 50 38 32 32 0 0 1-12 59z"/></svg>';

  var current = TREE;
  function render(node, fromChild) {
    current = node;
    nodesEl.innerHTML = ""; lines.innerHTML = "";
    var W = map.clientWidth, H = map.clientHeight, cx = W / 2, cy = H / 2;
    var list = map.classList.contains("is-list");
    map.setAttribute("data-depth", depth(node));
    map.setAttribute("data-tone", node.tone || "");

    // breadcrumb
    var path = []; for (var n = node; n; n = n.parent) path.unshift(n);
    crumbs.innerHTML = path.map(function (p, i) {
      return i < path.length - 1 ? '<button type="button" data-i="' + i + '">' + p.name + '</button><span aria-hidden="true">›</span>' : '<b>' + p.name + '</b>';
    }).join("");
    crumbs.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { render(path[+b.dataset.i]); }); });

    // centre
    var c = document.createElement(node.parent ? "button" : "div");
    if (node.parent) { c.type = "button"; c.setAttribute("aria-label", "Back to " + node.parent.name); }
    c.className = "sk-center" + (node.tone ? " tone-" + node.tone : "");
    c.innerHTML = CLOUD + '<span class="sk-c-in">' + (node.parent ? mark(node, "sk-c-logo") : iconSvg(node.icon)) + '<span class="sk-c-name">' + node.name + '</span>' +
      '<span class="sk-c-sub">' + (node.parent ? "← back" : "Click a cloud to explore") + '</span></span>';
    if (!list) { c.style.left = cx + "px"; c.style.top = cy + "px"; }
    if (node.parent) c.addEventListener("click", function () { render(node.parent, node); });
    nodesEl.appendChild(c);

    // children around the centre: one ring, or two rings for long lists
    var kids = node.children || [], n = kids.length;
    var rings = n > 12 ? [Math.ceil(n * 0.4), n - Math.ceil(n * 0.4)] : [n];
    var idx = 0;
    rings.forEach(function (count, r) {
      var rx = rings.length === 1 ? W * 0.38 : (r === 0 ? W * 0.25 : W * 0.43);
      var ry = rings.length === 1 ? H * 0.38 : (r === 0 ? H * 0.27 : H * 0.44);
      var off = r === 1 ? Math.PI / count : 0;
      for (var k = 0; k < count; k++, idx++) {
        var kid = kids[idx], isObj = typeof kid === "object";
        var a = -Math.PI / 2 + off + k * 2 * Math.PI / count;
        var x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
        var d = idx * (reduceMotion ? 0 : 0.035);
        if (!list) {
          var ln = document.createElementNS(NS, "line");
          ln.setAttribute("x1", cx); ln.setAttribute("y1", cy); ln.setAttribute("x2", x); ln.setAttribute("y2", y);
          ln.setAttribute("class", "sk-line" + (isObj ? " strong" : ""));
          ln.style.animationDelay = d + "s";
          lines.appendChild(ln);
          var dot = document.createElementNS(NS, "circle");
          dot.setAttribute("r", isObj ? 5 : 3.5); dot.setAttribute("cx", x); dot.setAttribute("cy", y);
          dot.setAttribute("class", "sk-dot" + (isObj ? " strong" : ""));
          lines.appendChild(dot);
          if (!reduceMotion && isObj) {
            var m = document.createElementNS(NS, "circle");
            m.setAttribute("r", 4); m.setAttribute("class", "sk-pulse");
            var am = document.createElementNS(NS, "animateMotion");
            am.setAttribute("dur", "2.4s"); am.setAttribute("repeatCount", "indefinite");
            am.setAttribute("begin", (k * 0.3) + "s");
            am.setAttribute("path", "M" + cx + " " + cy + " L" + x + " " + y);
            m.appendChild(am); lines.appendChild(m);
          }
        }
        var el;
        if (isObj) {
          el = document.createElement("button"); el.type = "button";
          el.className = "sk-cat" + (kid.tone ? " tone-" + kid.tone : "");
          el.innerHTML = CLOUD + '<span class="sk-k-in">' + mark(kid, "sk-k-logo") + '<span class="sk-k-name">' + (kid.short || kid.name) + '</span>' +
            '<span class="sk-k-n">' + kid.children.length + (kid.children.some(function (z) { return typeof z === "object"; }) ? " platforms" : " skills") + '</span></span>';
          el.setAttribute("aria-label", "Open " + kid.name);
          (function (kd) { el.addEventListener("click", function () { render(kd); }); })(kid);
        } else {
          el = document.createElement("span");
          el.className = "sk-leaf";
          var lf = logoFor(kid, node);
          el.innerHTML = (lf ? img(lf, "sk-l-logo") : '<span class="sk-l-dot" aria-hidden="true"></span>') + '<span>' + kid + '</span>';
        }
        if (!list) { el.style.left = x + "px"; el.style.top = y + "px"; }
        el.style.animationDelay = (d + 0.12) + "s";
        nodesEl.appendChild(el);
      }
    });
    // keep focus sensible for keyboard users
    if (fromChild === undefined && node !== TREE) { var f = nodesEl.querySelector(".sk-center"); f && f.focus({ preventScroll: true }); }
  }
  function depth(n) { var d = 0; while (n.parent) { d++; n = n.parent; } return d; }

  var narrowMQ = window.matchMedia("(max-width: 760px)");
  function layout() { map.classList.toggle("is-list", narrowMQ.matches); render(current, null); }
  layout();
  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
})();
