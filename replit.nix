{ pkgs }: {
    deps = [
        pkgs.nodejs_20
        pkgs.nodePackages.typescript-language-server
        pkgs.nodePackages.tsx
        pkgs.python311
        pkgs.python311Packages.numpy
        pkgs.python311Packages.pandas
        pkgs.python311Packages.scikit-learn
    ];
    previews = [{
        command = "npm run dev";
        name = "web";
        manager = "npm";
    }];
}
