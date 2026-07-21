{
  description = "Meal of Fortune development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" "x86_64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22
              pnpm
              git
              gh
              gnused
              coreutils
              librsvg
            ] ++ lib.optionals stdenv.isLinux [ chromium ];

            shellHook = ''
              ${pkgs.lib.optionalString pkgs.stdenv.isLinux ''
                export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
                export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
              ''}
            '';
          };
        });
    };
}
