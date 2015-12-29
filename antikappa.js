
// ==UserScript==
// @name         AntiKappa - Remove chat spam from Twitch.tv
// @namespace    http://tampermonkey.net/
// @version      0.82
// @description  Removes repetitive spam from Twitch.tv. Includes personal r9k mode, and removes caps lock, ascii, repetitive text if you want (and more). 
// @author       BlackOdd (Reddit: /u/BlackOdder)
// @include      http*://www.twitch.tv*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==
/* jshint -W097 */

var AntiKappa = {      

    //CHANGE SETTINGS HERE
    r9kModeBool: true, //personal twitch r9k
    blockExclusiveUpperCaseBool: true, //removes exclusive caps lock 
    blockMostlyUpperCaseBool: true,
    blockVeryLongMessagesBool: false, //removes long messages which usually contains repetitive copy pastes
    blockRepeatedWordInSentenceBool: true, //removes repeated words, like "Kappa Kappa Kappa"
    blockTypicalSpamBool: true, //removes suspected random spam
    blockNonEnglishCharactersBool: false, //blocks everything that isn't the standard ASCII character set
    //CHANGE SETTINGS HERE

    messageArray: [],
    debugModeBool: true,
    longMessageCountInt: 140,
    mostlyUpperCaseTheshholdPercentage: 70,
    repeatedWordInSentenceCountInt: 3,
    typicalSpamStringArray: [ //will block the sentence if it contains any of these words, and you have "blockTypicalSpamBool" set to true
        "gachi", "feelsgoodman", "feelsbadman", "kkona", 
    ],
};

$(document).ready(function(){  
    'use strict';

    AntiKappa.logDebugMessage = function(message){        
        if(AntiKappa.debugModeBool){
            console.log("AntiKappa - " + message);
        }
    };

    AntiKappa.mainLoop = function(){
        //AntiKappa.logDebugMessage('mainLoop'); 
        AntiKappa.checkMessages();
        AntiKappa.cleanUp();
    };

    AntiKappa.checkMessages = function(){
        //AntiKappa.logDebugMessage('addMessages');                
        $('ul.chat-lines span.message:not(.AntiKappaAccepted)').each(function(){            
            var $message = $(this);
            var $parent = $(this).parent().parent();
            //var text = AntiKappa.translateEmoticonsAndReturnTextFromMessage($message).trim();
            var textWithoutEmotes = $message.text();
            
            //AntiKappa.checkMessage(text, $message, $parent);
            AntiKappa.checkMessage(textWithoutEmotes, $message, $parent);
        });
    };
    
    AntiKappa.checkMessage = function(text, $message, $parent){
        if(!AntiKappa.isSpam(text)){
            AntiKappa.logDebugMessage('ACCEPTED: ' + text);

            $message.addClass('AntiKappaAccepted');
            $parent.addClass('AntiKappaAccepted');
            AntiKappa.messageArray.push(text);                        
        }
        else
        {            
            AntiKappa.logDebugMessage('REJECTED: ' + text);

            $parent.remove();
        }         
    };    
    
    AntiKappa.translateEmoticonsAndReturnTextFromMessage = function($message){
        var text = $message.text();        
        $message.children('.emoticon').each(function(){
            text = text + " " + $(this).attr('alt');
        });
        
        return text;
    };

    AntiKappa.purgeEntries = function(){
        AntiKappa.messageArray = [];
    };

    AntiKappa.cleanUp = function(){
        $('span.deleted').each(function(){
            $(this).parent().parent().remove();
        });
    };

    AntiKappa.isSpam = function(text){        
        if(text === ""){
            return true;
        }

        if(AntiKappa.blockVeryLongMessagesBool){
            if(text.length > AntiKappa.longMessageCountInt){
                return true;
            }
        }
        
        if(AntiKappa.blockMostlyUpperCaseBool){
            if(AntiKappa.isMostlyUpperCase(text)){
               return true;
            }
        }

        if(AntiKappa.blockExclusiveUpperCaseBool){
            if(text === text.toUpperCase()){
                return true;
            }             
        }        

        if(AntiKappa.blockRepeatedWordInSentenceBool && AntiKappa.isRepeatedWordInSentence(text)){
            return true;
        }

        if(AntiKappa.blockTypicalSpamBool){
            for (var i = 0; i < AntiKappa.typicalSpamStringArray.length - 1; i++) {
                var entry = AntiKappa.typicalSpamStringArray[i].toUpperCase();
                var compare = text.toUpperCase();
                if(compare.indexOf(entry) > -1){
                    return true;
                }
            }
        }

        if(AntiKappa.r9kModeBool){
            if(AntiKappa.messageArray.indexOf(text) > -1){
                return true;
            }                
        }                

        if(AntiKappa.blockNonEnglishCharactersBool){
            if(AntiKappa.isNonEnglishCharacter(text)){
                return true;
            }                
        }             

        return false;
    };

    AntiKappa.isRepeatedWordInSentence = function(text){
        var sortedStringArray = text.split(" ").sort();        
        var duplicatesStringArray = [];
        for (var i = 0; i < sortedStringArray.length - 1; i++) {
            if (sortedStringArray[i + 1] == sortedStringArray[i]) {
                duplicatesStringArray.push(sortedStringArray[i]);
            }
        }
        
        return duplicatesStringArray.length >= AntiKappa.repeatedWordInSentenceCountInt;
    };
    
    AntiKappa.isMostlyUpperCase = function(text){
        var textLength = text.length;
        var amountUpperCaseInt = 0;
        for (var i = 0, len = textLength; i < len; i++) {
            var char = text[i];
            if(char === char.toUpperCase()){
                amountUpperCaseInt++;
            }
        }
        
        var percentageUpperCase = 100 - (textLength - amountUpperCaseInt) / textLength * 100;
        
        return percentageUpperCase >= AntiKappa.mostlyUpperCaseTheshholdPercentage;
    };

    AntiKappa.isNonEnglishCharacter = function(text){
        var regex = /[^\u0000-\u007F]+/;
        return regex.test(text);
    };

    AntiKappa.addGlobalStyle = function(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    };

    AntiKappa.addGlobalStyle('.chat-lines div.ember-view { display: none; }');
    AntiKappa.addGlobalStyle('.AntiKappaAccepted { display: inline !important; }');
    AntiKappa.addGlobalStyle('.player-hover { display: block !important; }');
    setInterval(AntiKappa.mainLoop, 200);    
    setInterval(AntiKappa.purgeEntries, 1000 * 60 * 10);
});