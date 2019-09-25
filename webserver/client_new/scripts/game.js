define([
    'react',
    'components/Game',
    'mousetrap'
], function(
    React,
    GameClass,
    Mousetrap
) {

    var Game = React.createFactory(GameClass);

    Mousetrap.bind('backspace', function(e) {
        if(!confirm('사이트를 종료하시겠습니까?')) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                // internet explorer
                e.returnValue = false;
            }
        }
    });

    React.render(
        Game(),
        document.getElementById('game-container')
    );
});
