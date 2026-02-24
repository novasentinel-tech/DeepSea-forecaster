{ pkgs }: {
	deps = [
		pkgs.nodejs-20_x
		pkgs.nodePackages.typescript-language-server
		pkgs.nodePackages.tsx
		(pkgs.python311Packages.withPackages (ps: [
			ps.numpy
			ps.pandas
			ps.scikitlearn
		]))
	];
}